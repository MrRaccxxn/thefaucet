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

// Protected procedures
const enforceUserIsAuthed = middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "Authentication required. Please sign in to access this resource."
    });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.user },
      user: ctx.user,
      db: ctx.db,
    },
  });
});

const enforceUserIsAdmin = middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "Authentication required."
    });
  }

  // TODO: Implement admin role checking when user roles are added
  const isAdmin = false; // await checkUserIsAdmin(ctx.user.id);
  
  if (!isAdmin) {
    throw new TRPCError({ 
      code: "FORBIDDEN",
      message: "Admin access required"
    });
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.user },
      user: ctx.user,
      db: ctx.db,
    },
  });
});

// Rate limiting middleware
import { rateLimiter } from "../rate-limiting";

const createRateLimitMiddleware = (config: {
  windowMs: number;
  maxRequests: number;
  identifier?: string;
}) => {
  return middleware(async (opts) => {
    const { ctx } = opts;
    
    if (config.identifier === 'claim') {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required for claim operations'
        });
      }
      return opts.next({ ctx });
    }
    
    const identifier = ctx.user?.email || `ip:${opts.ctx.req.headers.get('x-forwarded-for') || 'unknown'}`;
    
    try {
      const result = await rateLimiter.checkLimit(identifier, config);
      
      if (!result.allowed) {
        const secondsUntilReset = Math.ceil((result.resetTime.getTime() - Date.now()) / 1000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Try again in ${secondsUntilReset} seconds.`
        });
      }
      
      return opts.next({ ctx });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Rate limit check failed:', error);
      return opts.next({ ctx });
    }
  });
};

const publicRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 100
});

const authenticatedRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 200
});

const adminRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 500
});

const claimRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  identifier: 'claim'
});

// Protected procedures
export const protectedProcedure = publicProcedure.use(enforceUserIsAuthed).use(authenticatedRateLimit);
export const adminProcedure = publicProcedure.use(enforceUserIsAdmin).use(adminRateLimit);

// Rate-limited procedures
export const publicRateLimitedProcedure = publicProcedure.use(publicRateLimit);
export const claimProcedure = protectedProcedure.use(claimRateLimit);

// Re-export types
export type { Context } from "./context";