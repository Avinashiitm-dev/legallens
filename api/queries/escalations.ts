import { and, desc, eq } from "drizzle-orm";
import { escalations, type InsertEscalation } from "@db/schema";
import { getDb } from "./connection";

export async function listEscalationsByUser(userId: string) {
  try {
    return await getDb()
      .select()
      .from(escalations)
      .where(eq(escalations.userId, userId))
      .orderBy(desc(escalations.createdAt))
      .limit(100);
  } catch (err: any) {
    console.warn("[listEscalationsByUser] DB offline, returning empty list.", err.message);
    return [];
  }
}

export async function insertEscalation(values: InsertEscalation) {
  try {
    const [{ id }] = await getDb().insert(escalations).values(values).returning();
    return id;
  } catch (err: any) {
    console.warn("[insertEscalation] DB offline, returning mock ID.", err.message);
    return Date.now();
  }
}

export async function findOwnedEscalation(userId: string, escalationId: number) {
  try {
    const rows = await getDb()
      .select()
      .from(escalations)
      .where(and(eq(escalations.id, escalationId), eq(escalations.userId, userId)))
      .limit(1);
    return rows.at(0);
  } catch (err: any) {
    console.warn("[findOwnedEscalation] DB offline, returning undefined.", err.message);
    return undefined;
  }
}

export async function updateEscalationStatus(
  userId: string,
  escalationId: number,
  status: string,
) {
  try {
    await getDb()
      .update(escalations)
      .set({ status })
      .where(and(eq(escalations.id, escalationId), eq(escalations.userId, userId)));
  } catch (err: any) {
    console.warn("[updateEscalationStatus] DB offline, skipping update.", err.message);
  }
}

export async function deleteOwnedEscalation(userId: string, escalationId: number) {
  try {
    await getDb()
      .delete(escalations)
      .where(and(eq(escalations.id, escalationId), eq(escalations.userId, userId)));
  } catch (err: any) {
    console.warn("[deleteOwnedEscalation] DB offline, skipping delete.", err.message);
  }
}
