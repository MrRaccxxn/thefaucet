import { TRPCError } from "@trpc/server";
import { middleware } from "../index";
import { db, users } from "@thefaucet/db";
import { eq } from "drizzle-orm";

// Admin-only middleware
export const enforceUserIsAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "Authentication required."
    });
  }

  const isAdmin = await checkIsAdmin(ctx.user);
  
  if (!isAdmin) {
    throw new TRPCError({ 
      code: "FORBIDDEN",
      message: "Admin access required."
    });
  }

  return next({
    ctx: {
      ...ctx,
      isAdmin: true,
    },
  });
});

// Generic role enforcement middleware
export const enforceUserHasRole = (requiredRole: string) =>
  middleware(async ({ ctx, next }) => {
    if (!ctx.session || !ctx.user) {
      throw new TRPCError({ 
        code: "UNAUTHORIZED",
        message: "Authentication required."
      });
    }

    const userRole = await getUserRole(ctx.user);
    
    if (userRole !== requiredRole) {
      throw new TRPCError({ 
        code: "FORBIDDEN",
        message: `Insufficient permissions. Required role: ${requiredRole}`
      });
    }

    return next({
      ctx: {
        ...ctx,
        userRole,
      },
    });
  });

// Helper function to get user role from database
async function getUserRole(user: any): Promise<string> {
  try {
    const userRecord = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    
    return userRecord[0]?.role || 'user';
  } catch (error) {
    console.error('Role check failed:', error);
    return 'user';
  }
}

// Helper function to check if user is admin
async function checkIsAdmin(user: any): Promise<boolean> {
  try {
    // Primary check: Database role field
    const userRecord = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    
    if (userRecord.length > 0 && userRecord[0]?.role === 'admin') {
      return true;
    }
    
    // Fallback: Environment variable admin emails for initial setup
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    return adminEmails.includes(user.email);
  } catch (error) {
    console.error('Admin check failed:', error);
    // Fail closed - deny admin access on database errors
    return false;
  }
}