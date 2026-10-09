import { and, desc, eq } from "drizzle-orm";
import { contractSessions } from "@db/schema";
import { getDb } from "./connection";

/** The user's current active workspace session, if any. */
export async function findActiveSession(userId: string) {
  try {
    const rows = await getDb()
      .select()
      .from(contractSessions)
      .where(and(eq(contractSessions.userId, userId), eq(contractSessions.status, "active")))
      .orderBy(desc(contractSessions.updatedAt))
      .limit(1);
    return rows.at(0);
  } catch (err: any) {
    console.warn("[findActiveSession] DB offline, returning null.", err.message);
    return null;
  }
}

/**
 * Upsert the user's single active session (workspace restore point).
 * Creates one on first use, updates it in place afterwards.
 */
export async function saveActiveSession(
  userId: string,
  values: { documentId?: number | null; title: string; activeView: string },
) {
  try {
    const existing = await findActiveSession(userId);
    if (existing) {
      await getDb()
        .update(contractSessions)
        .set({
          documentId: values.documentId ?? null,
          title: values.title,
          activeView: values.activeView,
        })
        .where(eq(contractSessions.id, existing.id));
      return existing.id;
    }
    const [{ id }] = await getDb()
      .insert(contractSessions)
      .values({ userId, ...values, documentId: values.documentId ?? null })
      .returning();
    return id;
  } catch (err: any) {
    console.warn("[saveActiveSession] DB offline, returning mock ID.", err.message);
    return Date.now();
  }
}

/** Close the active session (e.g. when the user starts a fresh workspace). */
export async function closeActiveSession(userId: string) {
  try {
    await getDb()
      .update(contractSessions)
      .set({ status: "closed" })
      .where(and(eq(contractSessions.userId, userId), eq(contractSessions.status, "active")));
  } catch (err: any) {
    console.warn("[closeActiveSession] DB offline, skipping close.", err.message);
  }
}
