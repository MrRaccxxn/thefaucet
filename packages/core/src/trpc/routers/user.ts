import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../index";
import { users, userProfiles, claims, assets } from "@thefaucet/db";
import { eq, and, count, sum, desc } from "drizzle-orm";
import type { AuthenticatedUser } from "../../types/auth";

export const userRouter = createTRPCRouter({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = (ctx.user as AuthenticatedUser).id;

      // Get user data from database
      const user = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found'
        });
      }

      // Get user profile data if it exists
      const profile = await ctx.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1);

      return {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        image: user[0].image,
        role: user[0].role,
        emailVerified: user[0].emailVerified,
        profile: profile[0] ? {
          githubId: profile[0].githubId,
          githubUsername: profile[0].githubUsername,
          accountAge: profile[0].accountAge,
          followersCount: profile[0].followersCount,
          repositoryCount: profile[0].repositoryCount,
          isVerified: profile[0].isVerified,
          lastValidationAt: profile[0].lastValidationAt
        } : null
      };
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user profile'
      });
    }
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = (ctx.user as AuthenticatedUser).id;

        // Check if user exists
        const existingUser = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!existingUser[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found'
          });
        }

        // If email is being updated, check if it's already taken
        if (input.email && input.email !== existingUser[0].email) {
          const emailExists = await ctx.db
            .select()
            .from(users)
            .where(eq(users.email, input.email))
            .limit(1);

          if (emailExists[0]) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Email address is already in use'
            });
          }
        }

        // Build update object with only provided fields
        const updateData: Partial<typeof users.$inferInsert> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.email !== undefined) updateData.email = input.email;

        // Only update if there are changes
        if (Object.keys(updateData).length === 0) {
          return { success: true, message: 'No changes to update' };
        }

        // Update user record
        const updatedUser = await ctx.db
          .update(users)
          .set(updateData)
          .where(eq(users.id, userId))
          .returning();

        if (!updatedUser[0]) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update user profile'
          });
        }

        return { 
          success: true, 
          message: 'Profile updated successfully',
          user: {
            id: updatedUser[0].id,
            email: updatedUser[0].email,
            name: updatedUser[0].name,
            image: updatedUser[0].image,
            role: updatedUser[0].role
          }
        };
      } catch (error) {
        console.error('Failed to update user profile:', error);
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user profile'
        });
      }
    }),

  // Get user statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = (ctx.user as AuthenticatedUser).id;

      // Get total claims count
      const claimsCountResult = await ctx.db
        .select({ count: count() })
        .from(claims)
        .where(eq(claims.userId, userId));

      const totalClaims = claimsCountResult[0]?.count || 0;

      // Get total amount claimed (sum of all native and ERC20 amounts)
      const amountResult = await ctx.db
        .select({ 
          totalAmount: sum(claims.amount)
        })
        .from(claims)
        .leftJoin(assets, eq(claims.assetId, assets.id))
        .where(and(
          eq(claims.userId, userId),
          eq(claims.status, 'confirmed') // Only confirmed claims
        ));

      const totalAmount = amountResult[0]?.totalAmount || "0";

      // Get last claim date
      const lastClaimResult = await ctx.db
        .select({ createdAt: claims.createdAt })
        .from(claims)
        .where(eq(claims.userId, userId))
        .orderBy(desc(claims.createdAt))
        .limit(1);

      const lastClaimDate = lastClaimResult[0]?.createdAt || null;

      // Get claims by asset type for breakdown
      const claimsByType = await ctx.db
        .select({
          assetType: assets.type,
          count: count(),
          totalAmount: sum(claims.amount)
        })
        .from(claims)
        .leftJoin(assets, eq(claims.assetId, assets.id))
        .where(and(
          eq(claims.userId, userId),
          eq(claims.status, 'confirmed')
        ))
        .groupBy(assets.type);

      // Get claims by status
      const claimsByStatus = await ctx.db
        .select({
          status: claims.status,
          count: count()
        })
        .from(claims)
        .where(eq(claims.userId, userId))
        .groupBy(claims.status);

      return {
        totalClaims: Number(totalClaims),
        totalAmount,
        lastClaimDate,
        breakdown: {
          byAssetType: claimsByType.map(item => ({
            type: item.assetType,
            count: Number(item.count),
            totalAmount: item.totalAmount || "0"
          })),
          byStatus: claimsByStatus.map(item => ({
            status: item.status,
            count: Number(item.count)
          }))
        }
      };
    } catch (error) {
      console.error('Failed to fetch user statistics:', error);
      return {
        totalClaims: 0,
        totalAmount: "0",
        lastClaimDate: null,
        breakdown: {
          byAssetType: [],
          byStatus: []
        }
      };
    }
  }),
});