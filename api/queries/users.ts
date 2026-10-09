import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { User, InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";
import type { DecodedIdToken } from "firebase-admin/auth";

export async function findUserById(id: string): Promise<User | undefined> {
  try {
    const rows = await getDb()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return rows.at(0);
  } catch (err: any) {
    console.warn(`[findUserById] Database connection error for user ${id}:`, err.message);
    return undefined;
  }
}

export async function findUserByUnionId(unionId: string) {
  try {
    const rows = await getDb()
      .select()
      .from(schema.users)
      .where(eq(schema.users.unionId, unionId))
      .limit(1);
    return rows.at(0);
  } catch (err: any) {
    console.warn(`[findUserByUnionId] Database connection error:`, err.message);
    return undefined;
  }
}

/**
 * Upsert a user row from a verified Firebase ID token.
 *
 * Called on every authenticated request so the Cloud SQL `user` table stays in
 * sync with Firebase Auth.  The Firebase UID becomes the Drizzle `id` primary
 * key.
 */
export async function findOrCreateUserFromFirebase(
  decoded: DecodedIdToken,
): Promise<User> {
  try {
    const existing = await findUserById(decoded.uid);
    if (existing) {
      // Bump lastSignInAt on each request (cheap update, no extra round-trip)
      await getDb()
        .update(schema.users)
        .set({ lastSignInAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.users.id, decoded.uid));
      return { ...existing, lastSignInAt: new Date() };
    }

    // First time this Firebase user hits the API → create a row
    const isOwner = decoded.uid === env.ownerUnionId;
    const now = new Date();

    const newUser: InsertUser = {
      id: decoded.uid,
      email: decoded.email ?? "",
      name: decoded.name ?? decoded.email?.split("@")[0] ?? "User",
      emailVerified: decoded.email_verified ?? false,
      image: decoded.picture ?? null,
      avatar: decoded.picture ?? null,
      role: isOwner ? "admin" : "user",
      createdAt: now,
      updatedAt: now,
      lastSignInAt: now,
    };

    await getDb().insert(schema.users).values(newUser).onConflictDoNothing();

    // Re-read to return the canonical row
    const inserted = await findUserById(decoded.uid);
    return inserted ?? (newUser as User);
  } catch (err: any) {
    console.warn("[findOrCreateUserFromFirebase] DB Connection error, falling back to mock user context:", err.message);
    const isOwner = decoded.uid === env.ownerUnionId;
    return {
      id: decoded.uid,
      email: decoded.email ?? "",
      name: decoded.name ?? decoded.email?.split("@")[0] ?? "User",
      emailVerified: decoded.email_verified ?? false,
      image: decoded.picture ?? null,
      avatar: decoded.picture ?? null,
      role: isOwner ? "admin" : "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignInAt: new Date(),
      unionId: null,
    } as User;
  }
}

export async function upsertUser(data: InsertUser) {
  const values = { ...data };
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await getDb()
    .insert(schema.users)
    .values(values)
    .onConflictDoUpdate({ target: schema.users.id, set: updateSet });
}
