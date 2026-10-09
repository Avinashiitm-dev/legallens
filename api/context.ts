import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { verifyIdToken } from "./auth";
import { findOrCreateUserFromFirebase } from "./queries/users";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  console.log(`[createContext] Request URL: ${opts.req.url}`);
  const authHeader = opts.req.headers.get("authorization") || opts.req.headers.get("Authorization");
  console.log(`[createContext] Authorization header present:`, !!authHeader);

  try {
    const decoded = await verifyIdToken(opts.req.headers);
    if (decoded) {
      try {
        const userOrUndefined = await findOrCreateUserFromFirebase(decoded);
        if (!userOrUndefined) {
          throw new Error("Database sync returned undefined user.");
        }
        ctx.user = userOrUndefined;
      } catch (dbErr) {
        console.error("AUTH_ERROR_DETAIL: Database sync error during user authentication. Ensure DATABASE_URL is correct and 'npm run db:push' was executed.", dbErr);
        // Graceful fallback: construct a temporary User object so the app doesn't crash or block the user
        ctx.user = {
          id: decoded.uid,
          email: decoded.email ?? "",
          name: decoded.name ?? decoded.email?.split("@")[0] ?? "User",
          role: "user",
          unionId: null,
          emailVerified: decoded.email_verified ?? false,
          image: decoded.picture ?? null,
          avatar: decoded.picture ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignInAt: new Date(),
        } as User;
      }
    } else {
      console.warn("[createContext] verifyIdToken returned null. Request is unauthenticated.");
    }
  } catch (err) {
    console.error("Token verification error:", err);
    // Authentication is optional here — unauthenticated requests get no user
  }
  
  if (!ctx.user) {
    console.warn(`[createContext] WARNING: ctx.user is undefined at the end of context generation for ${opts.req.url}`);
  }

  return ctx;
}
