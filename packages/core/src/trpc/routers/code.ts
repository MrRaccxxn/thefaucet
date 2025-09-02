import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicRateLimitedProcedure, protectedProcedure, adminProcedure } from "../index";
import { redeemCodes, codeRedemptions, claims, assets, chains } from "@thefaucet/db";
import { eq, and, gte, desc, count, lt } from "drizzle-orm";
import { faucetService } from "../../blockchain/faucet";
import { faucetRateLimiter } from "../../rate-limiting";
import type { AuthenticatedUser } from "../../types/auth";

export const codeRouter = createTRPCRouter({
  // Validate a redeem code (public to check validity before auth)
  validate: publicRateLimitedProcedure
    .input(z.object({ code: z.string().min(6).max(50) }))
    .query(async ({ input, ctx }) => {
      try {
        const code = await ctx.db
          .select()
          .from(redeemCodes)
          .where(and(
            eq(redeemCodes.code, input.code),
            eq(redeemCodes.isActive, true)
          ))
          .limit(1);

        if (!code[0]) {
          return {
            isValid: false,
            message: "Code not found or inactive"
          };
        }

        const redeemCode = code[0];

        // Check if code has expired
        if (redeemCode.expiresAt && new Date() > redeemCode.expiresAt) {
          return {
            isValid: false,
            message: "Code has expired"
          };
        }

        // Check if code has reached max uses
        if (redeemCode.currentUses >= redeemCode.maxUses) {
          return {
            isValid: false,
            message: "Code has reached maximum usage limit"
          };
        }

        return {
          isValid: true,
          codeType: "event" as const,
          description: redeemCode.description,
          expiresAt: redeemCode.expiresAt,
          maxUses: redeemCode.maxUses,
          currentUses: redeemCode.currentUses,
          remainingUses: redeemCode.maxUses - redeemCode.currentUses,
          boostedAmounts: redeemCode.boostedAmounts
        };
      } catch (error) {
        console.error('Code validation failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to validate code'
        });
      }
    }),

  // Redeem a code (requires authentication)
  redeem: protectedProcedure
    .input(
      z.object({
        code: z.string().min(6).max(50),
        chainId: z.number(),
        assetId: z.string(),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = (ctx.user as AuthenticatedUser).id;

        // Get and validate the redeem code
        const codeRecord = await ctx.db
          .select()
          .from(redeemCodes)
          .where(and(
            eq(redeemCodes.code, input.code),
            eq(redeemCodes.isActive, true)
          ))
          .limit(1);

        if (!codeRecord[0]) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Code not found or inactive'
          });
        }

        const redeemCode = codeRecord[0];

        // Check if code has expired
        if (redeemCode.expiresAt && new Date() > redeemCode.expiresAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Code has expired'
          });
        }

        // Check if code has reached max uses
        if (redeemCode.currentUses >= redeemCode.maxUses) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Code has reached maximum usage limit'
          });
        }

        // Check if user has already used this code
        const existingRedemption = await ctx.db
          .select()
          .from(codeRedemptions)
          .where(and(
            eq(codeRedemptions.codeId, redeemCode.id),
            eq(codeRedemptions.userId, userId)
          ))
          .limit(1);

        if (existingRedemption[0]) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You have already used this code'
          });
        }

        // Get asset details
        const asset = await ctx.db
          .select()
          .from(assets)
          .where(and(
            eq(assets.id, input.assetId),
            eq(assets.chainId, input.chainId),
            eq(assets.isActive, true)
          ))
          .limit(1);

        if (!asset[0]) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Asset not found or inactive'
          });
        }

        // Check rate limiting (codes might have different cooldowns)
        const rateLimitResult = await faucetRateLimiter.checkLimit({
          userId,
          assetType: asset[0].type as 'native' | 'erc20' | 'nft',
          chainId: input.chainId,
          cooldownHours: 1 // Shorter cooldown for codes
        });

        if (!rateLimitResult.allowed) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Rate limit exceeded. Next claim available at ${rateLimitResult.cooldownEnds?.toISOString()}`
          });
        }

        // Calculate boosted amount
        const boostedAmounts = redeemCode.boostedAmounts as Record<string, string> || {};
        const baseAmount = asset[0].type === 'native' 
          ? (process.env.NATIVE_TOKEN_AMOUNT || "0.05")
          : (process.env.ERC20_TOKEN_AMOUNT || "1000");
        
        const boostedAmount = boostedAmounts[asset[0].type] || 
          (parseFloat(baseAmount) * 2).toString(); // Default 2x boost

        // Get chain details for RPC URL
        const chain = await ctx.db
          .select()
          .from(chains)
          .where(eq(chains.chainId, input.chainId))
          .limit(1);

        if (!chain[0] || !chain[0].isActive) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Chain not supported or inactive'
          });
        }

        // Process the claim based on asset type
        let claimResult;
        if (asset[0].type === 'native') {
          claimResult = await faucetService.claimNativeToken(
            input.walletAddress,
            input.chainId,
            chain[0].rpcUrl
          );
        } else if (asset[0].type === 'erc20') {
          claimResult = await faucetService.claimERC20Token(
            input.walletAddress,
            boostedAmount,
            input.chainId,
            chain[0].rpcUrl
          );
        } else {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'NFT redemption via codes not supported yet'
          });
        }

        // Record the claim
        const newClaim = await ctx.db
          .insert(claims)
          .values({
            userId,
            assetId: input.assetId,
            walletAddress: input.walletAddress,
            amount: boostedAmount,
            txHash: claimResult.transactionHash,
            status: 'pending'
          })
          .returning();

        // Record the code redemption
        await ctx.db
          .insert(codeRedemptions)
          .values({
            codeId: redeemCode.id,
            userId,
            claimId: newClaim[0]!.id
          });

        // Update code usage count
        await ctx.db
          .update(redeemCodes)
          .set({
            currentUses: redeemCode.currentUses + 1,
            updatedAt: new Date()
          })
          .where(eq(redeemCodes.id, redeemCode.id));

        // Record rate limit
        await faucetRateLimiter.recordClaim({
          userId,
          assetType: asset[0].type as 'native' | 'erc20' | 'nft',
          chainId: input.chainId,
          cooldownHours: 1
        });

        return {
          success: true,
          transactionHash: claimResult.transactionHash,
          boostedAmount,
          originalAmount: baseAmount,
          estimatedConfirmTime: claimResult.estimatedConfirmTime
        };
      } catch (error) {
        console.error('Code redemption failed:', error);
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process code redemption'
        });
      }
    }),

  // Get user's redemption history
  getRedemptionHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = (ctx.user as AuthenticatedUser).id;
        const offset = (input.page - 1) * input.limit;

        // Get user's code redemptions with full details
        const redemptions = await ctx.db
          .select({
            redemption: codeRedemptions,
            code: redeemCodes,
            claim: claims,
            asset: assets
          })
          .from(codeRedemptions)
          .leftJoin(redeemCodes, eq(codeRedemptions.codeId, redeemCodes.id))
          .leftJoin(claims, eq(codeRedemptions.claimId, claims.id))
          .leftJoin(assets, eq(claims.assetId, assets.id))
          .where(eq(codeRedemptions.userId, userId))
          .orderBy(desc(codeRedemptions.createdAt))
          .limit(input.limit)
          .offset(offset);

        // Get total count
        const totalResult = await ctx.db
          .select({ count: count() })
          .from(codeRedemptions)
          .where(eq(codeRedemptions.userId, userId));

        const total = totalResult[0]?.count || 0;

        return {
          redemptions: redemptions.map(({ redemption, code, claim, asset }) => ({
            id: redemption.id,
            code: code?.code,
            codeDescription: code?.description,
            claimId: claim?.id,
            transactionHash: claim?.txHash,
            amount: claim?.amount,
            walletAddress: claim?.walletAddress,
            status: claim?.status,
            asset: asset ? {
              symbol: asset.symbol,
              name: asset.name,
              type: asset.type,
              chainId: asset.chainId
            } : null,
            redeemedAt: redemption.createdAt,
            confirmedAt: claim?.confirmedAt
          })),
          total,
          page: input.page,
          limit: input.limit,
          hasMore: offset + input.limit < total,
        };
      } catch (error) {
        console.error('Failed to fetch redemption history:', error);
        return {
          redemptions: [],
          total: 0,
          page: input.page,
          limit: input.limit,
          hasMore: false,
        };
      }
    }),

  // Admin: Generate new redeem codes
  generate: adminProcedure
    .input(
      z.object({
        codeType: z.enum(["event", "hackathon", "vip"]),
        expiresIn: z.number().min(1).max(365), // days
        boostMultiplier: z.number().min(1).max(10),
        maxUses: z.number().min(1).max(10000),
        description: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate unique code
        const generateCode = (type: string): string => {
          const prefix = type.toUpperCase().slice(0, 3);
          const year = new Date().getFullYear();
          const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
          const checksum = Math.random().toString(36).substring(2, 6).toUpperCase();
          return `${prefix}${year}-${randomPart}-${checksum}`;
        };

        let code: string;
        let attempts = 0;
        const maxAttempts = 10;

        // Ensure unique code
        do {
          code = generateCode(input.codeType);
          const existingCode = await ctx.db
            .select()
            .from(redeemCodes)
            .where(eq(redeemCodes.code, code))
            .limit(1);
          
          if (!existingCode[0]) break;
          attempts++;
        } while (attempts < maxAttempts);

        if (attempts >= maxAttempts) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate unique code after multiple attempts'
          });
        }

        const expiresAt = new Date(Date.now() + input.expiresIn * 24 * 60 * 60 * 1000);

        // Calculate boosted amounts for different asset types
        const baseNativeAmount = parseFloat(process.env.NATIVE_TOKEN_AMOUNT || "0.05");
        const baseERC20Amount = parseFloat(process.env.ERC20_TOKEN_AMOUNT || "1000");

        const boostedAmounts = {
          native: (baseNativeAmount * input.boostMultiplier).toString(),
          erc20: (baseERC20Amount * input.boostMultiplier).toString()
        };

        // Create the redeem code
        const newCode = await ctx.db
          .insert(redeemCodes)
          .values({
            code,
            description: input.description || `${input.codeType} code with ${input.boostMultiplier}x boost`,
            maxUses: input.maxUses,
            currentUses: 0,
            expiresAt,
            boostedAmounts,
            isActive: true
          })
          .returning();

        return {
          id: newCode[0]!.id,
          code,
          expiresAt,
          boostMultiplier: input.boostMultiplier,
          maxUses: input.maxUses,
          boostedAmounts,
          description: newCode[0]!.description
        };
      } catch (error) {
        console.error('Code generation failed:', error);
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate redeem code'
        });
      }
    }),

  // Admin: Get all codes with analytics
  getAllCodes: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        includeExpired: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const offset = (input.page - 1) * input.limit;
        const now = new Date();

        // Build where conditions
        let whereConditions = input.includeExpired 
          ? undefined 
          : gte(redeemCodes.expiresAt, now);

        // Get codes with redemption analytics
        const codesQuery = ctx.db
          .select({
            code: redeemCodes,
            redemptionCount: count(codeRedemptions.id)
          })
          .from(redeemCodes)
          .leftJoin(codeRedemptions, eq(redeemCodes.id, codeRedemptions.codeId))
          .groupBy(redeemCodes.id)
          .orderBy(desc(redeemCodes.createdAt))
          .limit(input.limit)
          .offset(offset);

        if (whereConditions) {
          codesQuery.where(whereConditions);
        }

        const codes = await codesQuery;

        // Get total count
        const totalQuery = ctx.db
          .select({ count: count() })
          .from(redeemCodes);

        if (whereConditions) {
          totalQuery.where(whereConditions);
        }

        const totalResult = await totalQuery;
        const total = totalResult[0]?.count || 0;

        // Calculate analytics for each code
        const codesWithAnalytics = codes.map(({ code, redemptionCount }) => {
          const isExpired = code.expiresAt ? new Date() > code.expiresAt : false;
          const usagePercentage = code.maxUses > 0 ? (code.currentUses / code.maxUses) * 100 : 0;
          const isExhausted = code.currentUses >= code.maxUses;

          return {
            id: code.id,
            code: code.code,
            description: code.description,
            maxUses: code.maxUses,
            currentUses: code.currentUses,
            redemptionCount: redemptionCount || 0,
            expiresAt: code.expiresAt,
            boostedAmounts: code.boostedAmounts,
            isActive: code.isActive,
            isExpired,
            isExhausted,
            usagePercentage: Math.round(usagePercentage),
            remainingUses: Math.max(0, code.maxUses - code.currentUses),
            createdAt: code.createdAt,
            updatedAt: code.updatedAt,
            status: isExpired ? 'expired' : isExhausted ? 'exhausted' : code.isActive ? 'active' : 'inactive'
          };
        });

        return {
          codes: codesWithAnalytics,
          total,
          page: input.page,
          limit: input.limit,
          hasMore: offset + input.limit < total,
          analytics: {
            totalActive: codesWithAnalytics.filter(c => c.status === 'active').length,
            totalExpired: codesWithAnalytics.filter(c => c.status === 'expired').length,
            totalExhausted: codesWithAnalytics.filter(c => c.status === 'exhausted').length,
            totalInactive: codesWithAnalytics.filter(c => c.status === 'inactive').length,
          }
        };
      } catch (error) {
        console.error('Failed to fetch codes:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch redeem codes'
        });
      }
    }),
});