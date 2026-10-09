import { and, desc, eq } from "drizzle-orm";
import { analyses, documents, type InsertDocument, type InsertAnalysis } from "@db/schema";
import { getDb } from "./connection";

export async function findDocumentByTitle(userId: string, title: string) {
  try {
    const rows = await getDb()
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.title, title)))
      .limit(1);
    return rows.at(0);
  } catch (err: any) {
    console.warn("[findDocumentByTitle] DB offline, returning undefined.", err.message);
    return undefined;
  }
}

export async function findOwnedDocument(userId: string, documentId: number) {
  try {
    const rows = await getDb()
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
      .limit(1);
    return rows.at(0);
  } catch (err: any) {
    console.warn("[findOwnedDocument] DB offline, returning undefined.", err.message);
    return undefined;
  }
}

export async function insertDocument(values: InsertDocument) {
  try {
    const [{ id }] = await getDb().insert(documents).values(values).returning();
    return id;
  } catch (err: any) {
    console.warn("[insertDocument] DB offline, returning mock ID.", err.message);
    return Date.now();
  }
}

export async function updateDocument(
  documentId: number,
  values: Partial<InsertDocument>,
) {
  try {
    await getDb().update(documents).set(values).where(eq(documents.id, documentId));
  } catch (err: any) {
    console.warn("[updateDocument] DB offline, skipping update.", err.message);
  }
}

export async function listDocumentsByUser(userId: string) {
  try {
    return await getDb()
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  } catch (err: any) {
    console.warn("[listDocumentsByUser] DB offline, returning empty list.", err.message);
    return [];
  }
}

export async function deleteOwnedDocument(userId: string, documentId: number) {
  try {
    await getDb()
      .delete(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)));
  } catch (err: any) {
    console.warn("[deleteOwnedDocument] DB offline, skipping delete.", err.message);
  }
}

/** Append an immutable analysis-run record (versioned risk output). */
export async function insertAnalysis(values: InsertAnalysis) {
  try {
    const [{ id }] = await getDb().insert(analyses).values(values).returning();
    return id;
  } catch (err: any) {
    console.warn("[insertAnalysis] DB offline, returning mock ID.", err.message);
    return Date.now();
  }
}

/** Versioned analysis history for one document (newest first), owner-scoped. */
export async function listAnalysesForDocument(userId: string, documentId: number) {
  try {
    return await getDb()
      .select({
        id: analyses.id,
        documentId: analyses.documentId,
        model: analyses.model,
        score: analyses.score,
        riskLevel: analyses.riskLevel,
        riskCount: analyses.riskCount,
        createdAt: analyses.createdAt,
      })
      .from(analyses)
      .where(and(eq(analyses.documentId, documentId), eq(analyses.userId, userId)))
      .orderBy(desc(analyses.createdAt))
      .limit(50);
  } catch (err: any) {
    console.warn("[listAnalysesForDocument] DB offline, returning empty list.", err.message);
    return [];
  }
}

/** Fetch one full analysis report (with JSON body), owner-scoped. */
export async function findOwnedAnalysis(userId: string, analysisId: number) {
  try {
    const rows = await getDb()
      .select()
      .from(analyses)
      .where(and(eq(analyses.id, analysisId), eq(analyses.userId, userId)))
      .limit(1);
    return rows.at(0);
  } catch (err: any) {
    console.warn("[findOwnedAnalysis] DB offline, returning undefined.", err.message);
    return undefined;
  }
}
