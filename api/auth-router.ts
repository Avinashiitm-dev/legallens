import { createRouter, authedQuery } from "./middleware";

export const authRouter = createRouter({
  /** Returns the authenticated user's profile from Postgres. */
  me: authedQuery.query((opts) => opts.ctx.user),
  /**
   * Logout is a no-op on the server — Firebase sessions are managed client-side.
   * This endpoint exists so the frontend can call `trpc.auth.logout` uniformly.
   */
  logout: authedQuery.mutation(async () => {
    return { success: true };
  }),
});
