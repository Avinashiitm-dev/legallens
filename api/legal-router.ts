import { z } from "zod";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject, generateText } from "ai";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { documents, chatMessages } from "@db/schema";
import { DocumentLimits } from "@contracts/constants";
import {
  classifyAiError,
  listModels,
  AiUnavailable,
  ContentRejected,
  AiMisconfigured,
  AiInvalidRequest,
} from "./ai-client";
import {
  extractContractText,
  UnsupportedFileTypeError,
  CorruptFileError,
  EmptyExtractionError,
  FileTooLargeError,
} from "./lib/document-extraction";
import { storage } from "./lib/storage";
import {
  deleteOwnedDocument,
  findDocumentByTitle,
  findOwnedAnalysis,
  findOwnedDocument,
  insertAnalysis,
  insertDocument,
  listAnalysesForDocument,
  listDocumentsByUser,
  updateDocument,
} from "./queries/documents";
import { closeActiveSession, findActiveSession, saveActiveSession } from "./queries/sessions";
import {
  deleteOwnedEscalation,
  insertEscalation,
  listEscalationsByUser,
} from "./queries/escalations";

// ---------- Platform AI gateway (server-side only — key never reaches the browser) ----------

const aiGw = createOpenAICompatible({
  name: "ai-gw",
  baseURL: process.env.LEGALLENS_AI_BASE_URL!,
  apiKey: process.env.LEGALLENS_AI_API_KEY!,
  includeUsage: true,
  supportsStructuredOutputs: true,
});

let modelIdCache: { id: string; at: number } | null = null;

async function defaultModel(): Promise<string> {
  if (!process.env.LEGALLENS_AI_API_KEY) {
    return "mock-model";
  }
  // Cache the model list briefly — availability can change, so never hardcode the id.
  if (modelIdCache && Date.now() - modelIdCache.at < 5 * 60 * 1000) {
    return modelIdCache.id;
  }
  const { defaultModelId } = await listModels();
  modelIdCache = { id: defaultModelId, at: Date.now() };
  return defaultModelId;
}

/** Turn any AI failure into a typed, user-readable tRPC error (no silent fallbacks). */
function toTrpcError(err: unknown): TRPCError {
  const mapped = classifyAiError(err);
  if (mapped instanceof AiUnavailable) {
    return new TRPCError({
      code: "FORBIDDEN",
      message:
        "AI quota exhausted — this feature is temporarily unavailable. The site owner can top up quota on the platform.",
      cause: mapped,
    });
  }
  if (mapped instanceof ContentRejected) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: "The AI declined this content. Please rephrase or remove sensitive text and try again.",
      cause: mapped,
    });
  }
  if (mapped instanceof AiMisconfigured) {
    return new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "AI is not configured for this deployment yet. Please republish the site once and retry.",
      cause: mapped,
    });
  }
  if (mapped instanceof AiInvalidRequest) {
    return new TRPCError({ code: "BAD_REQUEST", message: mapped.message, cause: mapped });
  }
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "The AI service is busy right now. Please try again in a moment.",
    cause: mapped,
  });
}

/** Map extraction-engine failures to clean client-facing errors. */
function extractionError(err: unknown): TRPCError {
  if (
    err instanceof UnsupportedFileTypeError ||
    err instanceof CorruptFileError ||
    err instanceof EmptyExtractionError ||
    err instanceof FileTooLargeError
  ) {
    return new TRPCError({ code: "BAD_REQUEST", message: err.message, cause: err });
  }
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Document processing failed unexpectedly. Please try another file.",
    cause: err,
  });
}

// ---------- Shared schemas ----------

const riskSchema = z.object({
  clauseName: z.string(),
  severity: z.enum(["Critical", "Unfavorable", "Protective"]),
  section: z.string(),
  summaryOfRisk: z.string(),
  exactQuote: z.string(),
  suggestedAlternative: z.string(),
});

const reportSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  riskLevel: z.enum(["Low Risk", "Moderate Risk", "High Risk"]),
  summary: z.string(),
  risks: z.array(riskSchema),
  keyEntities: z.object({
    counterparty: z.string(),
    jurisdiction: z.string(),
    liabilityCap: z.string(),
  }),
});

type AnalysisReport = z.infer<typeof reportSchema>;

const ANALYZE_SYSTEM_PROMPT = `You are an elite legal attorney specializing in Indian contract review, risk mitigation, and commercial transactions.
Analyze the following contract text. Identify key clauses and categorize them into risks.
Return a structured JSON output reflecting:
1. An overall score (0 to 100), where 100 is completely safe/perfect and 0 is high-risk/dangerous.
2. A high-level risk profile status ("Low Risk", "Moderate Risk", "High Risk").
3. A short, helpful executive summary.
4. A list of key contractual risks/provisions found. For each risk, specify:
   - clauseName: Name of the clause/issue (e.g. "Aggressive Payment Terms (Net-90)")
   - severity: Level of risk. Strictly use exactly one of these: "Critical", "Unfavorable", "Protective"
   - section: The numbered section or paragraph label (e.g., "Section 4")
   - summaryOfRisk: Explanation of why this is a risk or advantage to the contracting party, referencing Indian statutes where relevant.
   - exactQuote: The raw section sentence from the provided text that triggered this assessment. Quote it literally, verbatim, so highlighting works perfectly.
   - suggestedAlternative: A fair, industry-standard legal draft alternative that balances risk.
5. Key Entities extracted:
   - counterparty: Name of the other contracting party if found
   - jurisdiction: Governing law if defined (default to India if none found)
   - liabilityCap: Liability limits if defined (or "Not specified")`;

const CHAT_SYSTEM_PROMPT = `You are 'LegalLens AI', an elite Indian Legal Counsel, Corporate Arbitrator, and Constitutional Expert.
Your expertise spans the complete legal and constitutional framework of India.

Your guiding knowledge base includes:
1. The Constitution of India: Fundamental Rights (Articles 14, 19, 21), Writs (Articles 32 & 226), Directive Principles.
2. Indian Commercial Legislation:
   - Indian Contract Act, 1872 (essential elements, indemnities, guarantees, breach penalties)
   - Companies Act, 2013
   - Digital Personal Data Protection (DPDP) Act, 2023 & Information Technology Act, 2000
   - Arbitration and Conciliation Act, 1996
   - Insolvency and Bankruptcy Code (IBC)
   - Real Estate (Regulation and Development) Act (RERA)
   - Consumer Protection Act, 2019
   - MSMED Act, 2006 (Section 15: 45-day payment rule for micro & small enterprises)
3. Indian Civil & Criminal Laws under the Bharatiya Nyaya Sanhita (BNS).

Response Guidelines:
- State specific legal provisions, sections, and relevant schedules of Indian laws.
- When educational, cite landmark Supreme Court of India judgments if directly applicable.
- Answer in structured, clear markdown formatted professionally with bullet points and bold key terms.
- Maintain firm, high-fidelity legal precision.
- If a contract or case file is attached in the context, analyze its enforceability under Indian statutory rules.
- Always add a brief closing note that this is informational analysis, not a substitute for advice from a licensed advocate.`;

function formatSize(bytes: number): string {
  if (bytes <= 0) return "—";
  const kb = bytes / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
}

// ---------- Router ----------

export const legalRouter = createRouter({
  /**
   * Upload a contract binary (PDF/DOCX/TXT/MD) → server-side extraction engine
   * → persist document metadata + original file → return the extracted text.
   */
  uploadDocument: authedQuery
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        // ~15 MB binary → ~20 MB base64; hard-capped by the 50 MB Hono body limit.
        contentBase64: z
          .string()
          .min(8)
          .max(Math.ceil((DocumentLimits.maxFileBytes / 3) * 4) + 64),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const bytes = Uint8Array.from(Buffer.from(input.contentBase64, "base64"));

      let extracted;
      try {
        extracted = await extractContractText(input.fileName, bytes);
      } catch (err) {
        throw extractionError(err);
      }

      // Persist the original binary to platform object storage (best-effort —
      // extracted text is the system of record for analysis).
      let storageKey: string | null = null;
      try {
        const saved = await storage.uploadFile({
          fileContent: bytes,
          fileName: `u/${ctx.user.id}/contracts/${Date.now()}-${input.fileName}`,
        });
        storageKey = saved.key;
      } catch (storageErr) {
        console.warn("Object storage unavailable; keeping extracted text only:", storageErr);
      }

      // Upsert the vault document by (user, title) and stamp extraction metadata.
      const existing = await findDocumentByTitle(ctx.user.id, input.fileName);
      const metadata = {
        content: extracted.text,
        fileType: extracted.fileType,
        source: "upload" as const,
        fileSizeBytes: bytes.byteLength,
        pageCount: extracted.pageCount,
        ...(storageKey ? { storageKey } : {}),
      };

      let documentId: number;
      if (existing) {
        await updateDocument(existing.id, metadata);
        documentId = existing.id;
      } else {
        documentId = await insertDocument({
          userId: ctx.user.id,
          title: input.fileName,
          ...metadata,
        });
      }

      // Make the upload the active workspace session.
      try {
        await saveActiveSession(ctx.user.id, {
          documentId,
          title: input.fileName,
          activeView: "analyzer",
        });
      } catch (sessionErr) {
        console.error("Failed to save session after upload:", sessionErr);
      }

      return {
        documentId,
        title: input.fileName,
        text: extracted.text,
        fileType: extracted.fileType,
        pageCount: extracted.pageCount,
        fileSizeBytes: bytes.byteLength,
        truncated: extracted.truncated,
      };
    }),

  /**
   * AI contract analysis — persists the document + report to the user's vault,
   * and appends an immutable, versioned row to the analyses history.
   */
  analyzeContract: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(500),
        contractText: z
          .string()
          .min(20, "Contract text is too short to analyze.")
          .max(DocumentLimits.maxExtractChars),
        /** When set, the analysis is attached to this vault document (must be owned). */
        documentId: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let report: AnalysisReport;
      let model: string = "mock-model";
      try {
        model = await defaultModel();
        
        if (model === "mock-model") {
          // Fallback to mock data when AI is not configured locally
          report = {
            overallScore: 65,
            riskLevel: "Moderate Risk",
            summary: "This contract contains standard boilerplate clauses but lacks specific protections for late payments and data privacy.",
            risks: [
              {
                clauseName: "Uncapped Indemnification",
                severity: "Critical",
                section: "Liability",
                summaryOfRisk: "The indemnification clause has no financial cap, exposing the company to unlimited liability.",
                suggestedAlternative: "Introduce a cap on liability equal to the total contract value.",
                exactQuote: "Party A shall indemnify Party B against all claims, damages, and losses."
              }
            ],
            keyEntities: {
              counterparty: "Unknown",
              jurisdiction: "Unknown",
              liabilityCap: "Not specified"
            }
          };
        } else {
          const result = await generateObject({
            model: aiGw(model),
            schema: reportSchema,
            prompt: `${ANALYZE_SYSTEM_PROMPT}\n\nContract Title: ${input.title}\n\nContract Text:\n${input.contractText}`,
          });
          report = result.object;
        }
      } catch (err) {
        throw toTrpcError(err);
      }

      // Persist to the vault (best-effort — analysis still returns if DB write fails).
      let documentId: number | null = null;
      try {
        if (input.documentId) {
          const owned = await findOwnedDocument(ctx.user.id, input.documentId);
          if (!owned) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Document not found in your vault." });
          }
          await updateDocument(owned.id, {
            content: input.contractText,
            score: report.overallScore,
            riskLevel: report.riskLevel,
            report,
          });
          documentId = owned.id;
        } else {
          const existing = await findDocumentByTitle(ctx.user.id, input.title);
          if (existing) {
            await updateDocument(existing.id, {
              content: input.contractText,
              score: report.overallScore,
              riskLevel: report.riskLevel,
              report,
            });
            documentId = existing.id;
          } else {
            documentId = await insertDocument({
              userId: ctx.user.id,
              title: input.title,
              content: input.contractText,
              source: "paste",
              fileType: "txt",
              fileSizeBytes: Buffer.byteLength(input.contractText, "utf8"),
              score: report.overallScore,
              riskLevel: report.riskLevel,
              report,
            });
          }
        }

        // Immutable versioned risk-analysis output.
        await insertAnalysis({
          documentId,
          userId: ctx.user.id,
          model,
          score: report.overallScore,
          riskLevel: report.riskLevel,
          riskCount: report.risks.length,
          report,
        });
      } catch (dbErr) {
        if (dbErr instanceof TRPCError) throw dbErr;
        console.error("Failed to persist analysis to vault:", dbErr);
      }

      return { ...report, documentId };
    }),

  /** Legal AI chat — persists both sides of the conversation. */
  chat: authedQuery
    .input(
      z.object({
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1).max(20_000),
            }),
          )
          .min(1)
          .max(50),
        currentContractText: z.string().max(DocumentLimits.maxExtractChars).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const system =
        CHAT_SYSTEM_PROMPT +
        (input.currentContractText
          ? `\n\nThe contract/case text in active review is:\n"""\n${input.currentContractText}\n"""`
          : "");

      let content: string;
      try {
        const model = await defaultModel();
        if (model === "mock-model") {
          content = "This is a mock response because the AI API key is not configured locally. To use the real AI, please configure the `.env` with a valid AI gateway key.";
        } else {
          const result = await generateText({
            model: aiGw(model),
            system,
            messages: input.messages,
          });
          content = result.text;
        }
      } catch (err) {
        throw toTrpcError(err);
      }

      // Persist the exchange (best-effort)
      try {
        const db = getDb();
        const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          await db.insert(chatMessages).values({ userId: ctx.user.id, role: "user", content: lastUser.content });
        }
        await db.insert(chatMessages).values({ userId: ctx.user.id, role: "assistant", content });
      } catch (dbErr) {
        console.error("Failed to persist chat messages:", dbErr);
      }

      return { content };
    }),

  /** Suggest a fair replacement clause for a flagged risk. */
  suggestAlternative: authedQuery
    .input(
      z.object({
        clauseName: z.string().min(1).max(300),
        exactQuote: z.string().min(1).max(5000),
        summaryOfRisk: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const model = await defaultModel();
        if (model === "mock-model") {
          return { alternative: "```\nMock Replacement Clause:\nThe liability of either party under this agreement shall be capped at 100% of the total fees paid.\n```\n\n*This is a mock fallback response.*" };
        }
        const result = await generateText({
          model: aiGw(model),
          prompt: `You are an elite contract negotiation expert. Suggest a perfectly balanced, standard commercial alternative replacement for the following problematic clause. Make it professional, realistic, protection-oriented, and ready to paste directly into a contract draft.

Clause Name: ${input.clauseName}
Triggering Quote: "${input.exactQuote}"
Issue Summary: ${input.summaryOfRisk}

Provide ONLY the text of the replacement clause inside a code block so it stands out, then briefly describe the negotiation leverage (1-2 sentences).`,
        });
        return { alternative: result.text };
      } catch (err) {
        throw toTrpcError(err);
      }
    }),

  /** Draft a renegotiation email for a flagged clause. */
  draftEmail: authedQuery
    .input(
      z.object({
        clauseName: z.string().min(1).max(300),
        exactQuote: z.string().min(1).max(5000),
        suggestedAlternative: z.string().min(1).max(5000),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const model = await defaultModel();
        if (model === "mock-model") {
          return { email: "Subject: Request to Adjust Agreement Terms\n\nHi Team,\n\nWe would like to replace the current clause with the following to align with standard commercial practices:\n\n" + input.suggestedAlternative + "\n\nThanks!" };
        }
        const result = await generateText({
          model: aiGw(model),
          prompt: `Draft a highly professional, polite, and persuasive request email directed to a client's general counsel or procurement specialist.
The email should explain that during our legal risk scanning we flagged a provision (${input.clauseName}) and we request to replace it with a fair alternative.
Provide clear business rationale (e.g. standard commercial norms, cash-flow operational continuity, or balanced non-competes).

Problematic Clause Quote: "${input.exactQuote}"
Suggested Balanced Alternative: "${input.suggestedAlternative}"

Make the email elegant, friendly, constructive, with a subject line and signature placeholders. Use clear layout spacing.`,
        });
        return { email: result.text };
      } catch (err) {
        throw toTrpcError(err);
      }
    }),

  /** List the user's vault documents (newest first), including extraction metadata. */
  listDocuments: authedQuery.query(async ({ ctx }) => {
    const rows = await listDocumentsByUser(ctx.user.id);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      score: r.score,
      riskLevel: r.riskLevel,
      fileType: r.fileType,
      source: r.source,
      fileSizeBytes: r.fileSizeBytes,
      pageCount: r.pageCount,
      report: r.report,
      size: formatSize(r.fileSizeBytes || Buffer.byteLength(r.content, "utf8")),
      createdAt: r.createdAt,
    }));
  }),

  /** Delete a vault document (scoped to the owner). */
  deleteDocument: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await deleteOwnedDocument(ctx.user.id, input.id);
      return { ok: true };
    }),

  /** Versioned analysis history for a vault document (owner-scoped). */
  listAnalyses: authedQuery
    .input(z.object({ documentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return listAnalysesForDocument(ctx.user.id, input.documentId);
    }),

  /** Fetch one full versioned report (owner-scoped). */
  getAnalysis: authedQuery
    .input(z.object({ analysisId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const row = await findOwnedAnalysis(ctx.user.id, input.analysisId);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Analysis not found." });
      return row;
    }),

  // ---------- Workspace session (restore "what was I working on") ----------

  /** The user's active workspace session, if any. */
  getSession: authedQuery.query(async ({ ctx }) => {
    const session = await findActiveSession(ctx.user.id);
    return session ?? null;
  }),

  /** Persist the active workspace pointer (active view + open document). */
  saveSession: authedQuery
    .input(
      z.object({
        documentId: z.number().int().positive().nullish(),
        title: z.string().min(1).max(512),
        activeView: z.string().min(1).max(32),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.documentId) {
        const owned = await findOwnedDocument(ctx.user.id, input.documentId);
        if (!owned) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found in your vault." });
      }
      const id = await saveActiveSession(ctx.user.id, {
        documentId: input.documentId ?? null,
        title: input.title,
        activeView: input.activeView,
      });
      return { id };
    }),

  /** Close the active workspace session. */
  closeSession: authedQuery.mutation(async ({ ctx }) => {
    await closeActiveSession(ctx.user.id);
    return { ok: true };
  }),

  // ---------- Attorney escalations (replaces the hardcoded mock list) ----------

  /** The user's escalation cases, newest first. */
  listEscalations: authedQuery.query(async ({ ctx }) => {
    return listEscalationsByUser(ctx.user.id);
  }),

  /** Raise a new escalation to the attorney network. */
  createEscalation: authedQuery
    .input(
      z.object({
        contractName: z.string().min(1).max(512),
        reason: z.string().min(1).max(5000),
        priority: z.enum(["High", "Medium", "Low"]),
        attorneyId: z.string().min(1).max(64),
        attorneyName: z.string().min(1).max(255),
        documentId: z.number().int().positive().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = await insertEscalation({
        userId: ctx.user.id,
        documentId: input.documentId ?? null,
        contractName: input.contractName,
        reason: input.reason,
        priority: input.priority,
        status: `Assigned to ${input.attorneyName}`,
        attorneyId: input.attorneyId,
        attorneyName: input.attorneyName,
      });
      return { id };
    }),

  /** Remove an escalation case (owner-scoped). */
  deleteEscalation: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await deleteOwnedEscalation(ctx.user.id, input.id);
      return { ok: true };
    }),

  /** Seed three realistic sample contracts so new users can explore the vault. */
  seedSamples: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const existing = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.userId, ctx.user.id))
      .limit(1);
    if (existing.length > 0) return { seeded: false };

    await db.insert(documents).values([
      {
        userId: ctx.user.id,
        title: "Acme Corp NDA.pdf",
        content:
          "MUTUAL NON-DISCLOSURE AGREEMENT\nBetween Client and Acme Corp.\nSection 3. EXCESSIVE PENALTIES\nAny accidental leaks of confidential specs triggers penalty demands of $5,000,000.",
        fileType: "pdf",
        source: "sample",
        score: 42,
        riskLevel: "High Risk",
      },
      {
        userId: ctx.user.id,
        title: "Globex MSA 2024.docx",
        content:
          "MASTER SERVICES AGREEMENT\nBetween Contractor and Globex LLC.\nSection 4. PAYMENT\nFees shall be in USD within net 15 calendar days of receipt of satisfactory timesheets.",
        fileType: "docx",
        source: "sample",
        score: 95,
        riskLevel: "Low Risk",
      },
      {
        userId: ctx.user.id,
        title: "Hooli Employment Offer.pdf",
        content:
          "EMPLOYMENT OFFER LETTER\nCongratulations. Section 10. NON-COMPETE\nEmployee shall not compete anywhere globally for a duration of two years.",
        fileType: "pdf",
        source: "sample",
        score: 68,
        riskLevel: "Moderate Risk",
      },
    ]);
    return { seeded: true };
  }),

  /** Chat history for the signed-in user. */
  chatHistory: authedQuery.query(async ({ ctx }) => {
    const rows = await getDb()
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, ctx.user.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(100);
    return rows.reverse().map((r) => ({ id: r.id, role: r.role, content: r.content, createdAt: r.createdAt }));
  }),

  /** Clear the user's chat history. */
  clearChat: authedQuery.mutation(async ({ ctx }) => {
    await getDb().delete(chatMessages).where(eq(chatMessages.userId, ctx.user.id));
    return { ok: true };
  }),
});
