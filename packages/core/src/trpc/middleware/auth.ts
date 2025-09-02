import { TRPCError } from "@trpc/server";
import { middleware } from "../index";
import type { AuthenticatedUser } from "../../types/auth";

// Authentication middleware for protected routes
export const enforceUserIsAuthed = middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "Authentication required. Please sign in to access this resource."
    });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.user },
      user: ctx.user as AuthenticatedUser,
      db: ctx.db,
    },
  });
});

// Role-based access control middleware
export const enforceUserHasRole = (requiredRole: string) =>
  middleware(({ ctx, next }) => {
    if (!ctx.session || !ctx.user) {
      throw new TRPCError({ 
        code: "UNAUTHORIZED",
        message: "Authentication required."
      });
    }

    // TODO: Implement role checking when user roles are added to the database
    // For now, this is a placeholder that will be updated when user roles are implemented
    const userRole = "user"; // await getUserRole(ctx.user.id);
    
    if (userRole !== requiredRole) {
      throw new TRPCError({ 
        code: "FORBIDDEN",
        message: `Insufficient permissions. Required role: ${requiredRole}`
      });
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.user },
        user: ctx.user as AuthenticatedUser,
        db: ctx.db,
        userRole,
      },
    });
  });