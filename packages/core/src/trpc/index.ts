import { initTRPC, TRPCError } from "@trpc/server";
import { type Context } from "./context";
import superjson from "superjson";
import { ZodError } from "zod";

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Import middleware
import { enforceUserIsAuthed } from "./middleware/auth";
import { enforceUserIsAdmin } from "./middleware/admin";
import { publicRateLimit, authenticatedRateLimit, adminRateLimit, claimRateLimit } from "./middleware/rateLimit";

// Protected procedures
export const protectedProcedure = publicProcedure.use(enforceUserIsAuthed).use(authenticatedRateLimit);
export const adminProcedure = publicProcedure.use(enforceUserIsAdmin).use(adminRateLimit);

// Rate-limited procedures
export const publicRateLimitedProcedure = publicProcedure.use(publicRateLimit);
export const claimProcedure = protectedProcedure.use(claimRateLimit);

// Re-export types
export type { Context } from "./context";