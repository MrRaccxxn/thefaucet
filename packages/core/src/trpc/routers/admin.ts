import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "../index";
import { users, claims, chains, assets } from "@thefaucet/db";
import { count, sum, eq, like, desc, or, and } from "drizzle-orm";

export const adminRouter = createTRPCRouter({
  // Get system statistics
  getSystemStats: adminProcedure.query(async ({ ctx }) => {
    try {
      const [
        userCount,
        claimCount,
        totalDistributed,
        activeChainCount
      ] = await Promise.all([
        ctx.db.select({ count: count() }).from(users),
        ctx.db.select({ count: count() }).from(claims),
        ctx.db.select({ total: sum(claims.amount) }).from(claims),
        ctx.db.select({ count: count() }).from(chains).where(eq(chains.isActive, true))
      ]);

      return {
        totalUsers: userCount[0]?.count || 0,
        totalClaims: claimCount[0]?.count || 0,
        totalAmountDistributed: totalDistributed[0]?.total || "0",
        activeChains: activeChainCount[0]?.count || 0,
        systemHealth: "healthy" as const,
      };
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      return {
        totalUsers: 0,
        totalClaims: 0,
        totalAmountDistributed: "0",
        activeChains: 0,
        systemHealth: "error" as const,
      };
    }
  }),

  // Manage chain configurations
  updateChain: adminProcedure
    .input(
      z.object({
        chainId: z.number(),
        name: z.string().optional(),
        rpcUrl: z.string().url().optional(),
        isActive: z.boolean().optional(),
        dailyLimit: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const updateData: any = {};
        
        if (input.name !== undefined) updateData.name = input.name;
        if (input.rpcUrl !== undefined) updateData.rpcUrl = input.rpcUrl;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        if (input.dailyLimit !== undefined) updateData.dailyLimit = input.dailyLimit;

        const result = await ctx.db
          .update(chains)
          .set(updateData)
          .where(eq(chains.chainId, input.chainId))
          .returning();

        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Chain with ID ${input.chainId} not found`
          });
        }

        return { success: true, chain: result[0] };
      } catch (error) {
        console.error('Failed to update chain:', error);
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update chain configuration'
        });
      }
    }),

  // Manage asset configurations
  updateAsset: adminProcedure
    .input(
      z.object({
        chainId: z.number(),
        assetId: z.string(),
        faucetAmount: z.string().optional(),
        isActive: z.boolean().optional(),
        dailyLimit: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const updateData: any = {};
        
        if (input.faucetAmount !== undefined) updateData.faucetAmount = input.faucetAmount;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        if (input.dailyLimit !== undefined) updateData.dailyLimit = input.dailyLimit;

        const result = await ctx.db
          .update(assets)
          .set(updateData)
          .where(
            and(
              eq(assets.chainId, input.chainId),
              eq(assets.id, input.assetId)
            )
          )
          .returning();

        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Asset ${input.assetId} on chain ${input.chainId} not found`
          });
        }

        return { success: true, asset: result[0] };
      } catch (error) {
        console.error('Failed to update asset:', error);
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update asset configuration'
        });
      }
    }),

  // Get user management data
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const offset = (input.page - 1) * input.limit;
        
        // Build search conditions
        const searchConditions = input.search 
          ? or(
              like(users.email, `%${input.search}%`),
              like(users.name, `%${input.search}%`)
            )
          : undefined;

        // Get users with search and pagination
        const userList = await ctx.db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            emailVerified: users.emailVerified,
            image: users.image
          })
          .from(users)
          .where(searchConditions)
          .orderBy(desc(users.emailVerified))
          .limit(input.limit)
          .offset(offset);

        // Get total count for pagination
        const totalResult = await ctx.db
          .select({ count: count() })
          .from(users)
          .where(searchConditions);

        const total = totalResult[0]?.count || 0;

        return {
          users: userList,
          total,
          page: input.page,
          limit: input.limit,
          hasMore: offset + input.limit < total,
        };
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return {
          users: [],
          total: 0,
          page: input.page,
          limit: input.limit,
          hasMore: false,
        };
      }
    }),

  // Ban/unban users
  updateUserStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(['user', 'admin', 'moderator']).optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const updateData: any = {};
        
        if (input.role !== undefined) updateData.role = input.role;

        const result = await ctx.db
          .update(users)
          .set(updateData)
          .where(eq(users.id, input.userId))
          .returning({
            id: users.id,
            email: users.email,
            role: users.role
          });

        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `User with ID ${input.userId} not found`
          });
        }

        return { success: true, user: result[0] };
      } catch (error) {
        console.error('Failed to update user status:', error);
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user status'
        });
      }
    }),
});