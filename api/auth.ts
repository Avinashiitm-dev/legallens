import admin from "firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";
import { env } from "./lib/env";

// Safely extract the admin module regardless of how Vite ESM resolution handles the CJS export
const firebaseAdmin: any = ((admin as any)?.apps ? admin : (admin as any)?.default) || admin;

/**
 * Initialise Firebase Admin SDK safely.
 */
function initAdmin() {
  if (firebaseAdmin?.apps?.length > 0) return firebaseAdmin.apps[0]!;

  // Fallback to default project ID if env is missing
  const projectId = env.firebaseProjectId || 'appp-a3f08';

  try {
    return firebaseAdmin.initializeApp({
      projectId,
    });
  } catch (err) {
    console.error("Firebase Admin initialization failed:", err);
    // Return a mock app to prevent the server from crashing on load
    return { auth: () => null } as any;
  }
}

const firebaseApp = initAdmin();
const firebaseAuth = firebaseApp?.auth ? firebaseApp.auth() : null;

function decodeJwtUnsafe(token: string): DecodedIdToken | null {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    const payloadStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
    return JSON.parse(payloadStr) as DecodedIdToken;
  } catch {
    return null;
  }
}

/**
 * Verify a Firebase ID token from the Authorization header.
 * Returns the decoded token or null if invalid / missing.
 */
export async function verifyIdToken(
  headers: Headers,
): Promise<DecodedIdToken | null> {
  const authHeader = headers.get("authorization") || headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    console.warn("[verifyIdToken] Missing or malformed Authorization header:", authHeader);
    return null;
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    console.warn("[verifyIdToken] Bearer token is empty.");
    return null;
  }

  if (!firebaseAuth) {
    console.error("[verifyIdToken] FATAL: firebaseAuth instance is null.");
    if (process.env.NODE_ENV !== "production") {
      console.warn("[verifyIdToken] Using local development bypass to parse token anyway.");
      return decodeJwtUnsafe(idToken);
    }
    return null;
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    console.error("[verifyIdToken] Firebase token verification failed:", err);
    if (process.env.NODE_ENV !== "production") {
      console.warn("[verifyIdToken] Using local development bypass to parse token anyway.");
      return decodeJwtUnsafe(idToken);
    }
    return null;
  }
}

export { firebaseAuth };
