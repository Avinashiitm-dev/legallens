/**
 * document-extraction.ts — server-side text extraction engine for legal contracts.
 *
 * Replaces the old client-side "paste only" flow. Handles multi-page PDFs
 * (via pdf.js, page-by-page with layout-aware line breaks) and DOCX files
 * (via mammoth), plus plain text/markdown passthrough.
 *
 * Server-only module: it runs inside the Hono/tRPC backend and never ships
 * to the browser bundle.
 */


import { DocumentLimits } from "@contracts/constants";

/**
 * pdf.js is loaded at runtime via createRequire (shadowing `require`, so the
 * bundler leaves it external). This keeps the server bundle lean and avoids
 * pulling in the optional `canvas` native dependency, which pdf.js only needs
 * for rendering — never for text extraction.
 */
const nodeRequire = require;

interface PdfTextItem {
  str: string;
  hasEOL?: boolean;
}

interface PdfPageProxy {
  getTextContent(): Promise<{ items: unknown[] }>;
  cleanup(): void;
}

interface PdfDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPageProxy>;
  destroy(): Promise<void>;
}

interface PdfJsModule {
  getDocument(options: {
    data: Uint8Array;
    isEvalSupported?: boolean;
    disableFontFace?: boolean;
    verbosity?: number;
  }): { promise: Promise<PdfDocumentProxy> };
}

let pdfjsModule: PdfJsModule | null = null;

function loadPdfJs(): PdfJsModule {
  if (!pdfjsModule) {
    pdfjsModule = nodeRequire("pdfjs-dist/legacy/build/pdf.js") as PdfJsModule;
  }
  return pdfjsModule;
}

export type ExtractedFileType = "pdf" | "docx" | "txt" | "md";

export interface ExtractionResult {
  /** Cleaned plain text, capped at DocumentLimits.maxExtractChars. */
  text: string;
  fileType: ExtractedFileType;
  /** PDF page count; null for DOCX/TXT sources. */
  pageCount: number | null;
  /** Character count before truncation. */
  charCount: number;
  /** True when the source text exceeded maxExtractChars and was cut. */
  truncated: boolean;
}

/** The file extension is not supported by the extraction engine. */
export class UnsupportedFileTypeError extends Error {
  constructor(ext: string) {
    super(
      `Unsupported file type ".${ext}". Please upload a PDF, DOCX, TXT, MD or JSON file.`,
    );
    this.name = "UnsupportedFileTypeError";
  }
}

/** The binary could not be parsed as the declared format (corrupt/encrypted). */
export class CorruptFileError extends Error {
  constructor(detail?: string) {
    super(
      `The file could not be parsed — it may be corrupted or password-protected.${detail ? ` (${detail})` : ""
      }`,
    );
    this.name = "CorruptFileError";
  }
}

/** Extraction succeeded structurally but produced no selectable text (scanned image PDF). */
export class EmptyExtractionError extends Error {
  constructor() {
    super(
      "No selectable text was found in this document. Scanned/image-only PDFs need OCR before analysis — please upload a text-based PDF or paste the content.",
    );
    this.name = "EmptyExtractionError";
  }
}

export class FileTooLargeError extends Error {
  constructor(bytes: number) {
    super(
      `File is too large (${(bytes / (1024 * 1024)).toFixed(1)} MB). Maximum supported size is ${DocumentLimits.maxFileBytes / (1024 * 1024)
      } MB.`,
    );
    this.name = "FileTooLargeError";
  }
}

function detectExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase().trim() ?? "";
  return ext;
}

/** Collapse extraction artifacts while preserving paragraph/section structure. */
function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n") // CRLF → LF
    .replace(/\t/g, "  ")
    .replace(/[ \u00a0]{2,}/g, " ") // collapse runs of spaces / nbsp
    .replace(/\n{3,}/g, "\n\n") // cap blank-line runs
    .trim();
}

function truncate(text: string): { text: string; truncated: boolean } {
  if (text.length <= DocumentLimits.maxExtractChars) return { text, truncated: false };
  return { text: text.slice(0, DocumentLimits.maxExtractChars), truncated: true };
}

/**
 * Extract text from a PDF buffer using pdf.js (legacy Node build — no DOM/canvas
 * required). Iterates page by page and reconstructs line breaks from the text
 * layout so clause boundaries survive for the analyzer's verbatim quoting.
 */
async function extractPdf(bytes: Uint8Array): Promise<{ text: string; pageCount: number }> {
  const pdfjs = loadPdfJs();

  let doc: PdfDocumentProxy;
  try {
    doc = await pdfjs.getDocument({
      data: bytes,
      isEvalSupported: false,
      disableFontFace: true,
      verbosity: 0,
    }).promise;
  } catch (err) {
    throw new CorruptFileError(err instanceof Error ? err.message : undefined);
  }

  try {
    const pageCount: number = doc.numPages;
    const pagesToRead = Math.min(pageCount, DocumentLimits.maxPdfPages);
    const chunks: string[] = [];

    for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      let pageText = "";
      for (const item of content.items) {
        // TextItem carries `str` and `hasEOL`; TextMarkedContent items are skipped.
        if (typeof item === "object" && item !== null && "str" in item) {
          const textItem = item as PdfTextItem;
          pageText += textItem.str;
          pageText += textItem.hasEOL ? "\n" : " ";
        }
      }
      chunks.push(pageText);
      page.cleanup();
    }

    return { text: chunks.join("\n\n"), pageCount };
  } catch (err) {
    if (err instanceof EmptyExtractionError || err instanceof CorruptFileError) throw err;
    throw new CorruptFileError(err instanceof Error ? err.message : undefined);
  } finally {
    await doc.destroy();
  }
}

/** Extract raw text from a DOCX binary via mammoth. */
async function extractDocx(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  try {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return result.value;
  } catch (err) {
    throw new CorruptFileError(err instanceof Error ? err.message : undefined);
  }
}

/**
 * Main entry point: extract normalized plain text + metadata from an uploaded
 * contract binary.
 *
 * @throws UnsupportedFileTypeError | FileTooLargeError | CorruptFileError | EmptyExtractionError
 */
export async function extractContractText(
  fileName: string,
  bytes: Uint8Array,
): Promise<ExtractionResult> {
  if (bytes.byteLength === 0) {
    throw new CorruptFileError("empty file");
  }
  if (bytes.byteLength > DocumentLimits.maxFileBytes) {
    throw new FileTooLargeError(bytes.byteLength);
  }

  const ext = detectExtension(fileName);
  let rawText: string;
  let fileType: ExtractedFileType;
  let pageCount: number | null = null;

  switch (ext) {
    case "pdf": {
      const pdf = await extractPdf(bytes);
      rawText = pdf.text;
      pageCount = pdf.pageCount;
      fileType = "pdf";
      break;
    }
    case "docx": {
      rawText = await extractDocx(bytes);
      fileType = "docx";
      break;
    }
    case "doc": {
      throw new UnsupportedFileTypeError("doc"); // legacy binary format — ask for .docx
    }
    case "txt":
    case "md":
    case "json": {
      rawText = Buffer.from(bytes).toString("utf8");
      fileType = ext === "txt" || ext === "json" ? "txt" : "md";
      break;
    }
    default:
      throw new UnsupportedFileTypeError(ext || "unknown");
  }

  const normalized = normalizeText(rawText);
  if (normalized.length < 20) {
    throw new EmptyExtractionError();
  }

  const { text, truncated } = truncate(normalized);
  return { text, fileType, pageCount, charCount: normalized.length, truncated };
}
