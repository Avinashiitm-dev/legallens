import { authRouter } from "./auth-router";
import { legalRouter } from "./legal-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  legal: legalRouter,
});

export type AppRouter = typeof appRouter;
