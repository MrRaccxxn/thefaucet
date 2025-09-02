import { z } from "zod";
import { createTRPCRouter, publicRateLimitedProcedure } from "../index";
import { assets, chains, claims, claimLimits } from "@thefaucet/db";
import { eq, and, gte, sum, count } from "drizzle-orm";
import { balanceService } from "../../blockchain/balance";

export const assetRouter = createTRPCRouter({
  // Get all available assets for a chain
  getByChain: publicRateLimitedProcedure
    .input(z.object({ chainId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const assetList = await ctx.db
          .select({
            id: assets.id,
            name: assets.name,
            symbol: assets.symbol,
            type: assets.type,
            decimals: assets.decimals,
            address: assets.address,
            isActive: assets.isActive,
          })
          .from(assets)
          .where(
            and(eq(assets.chainId, input.chainId), eq(assets.isActive, true))
          );

        return assetList;
      } catch (error) {
        console.error("Failed to fetch assets by chain:", error);
        return [];
      }
    }),

  // Get specific asset details
  getById: publicRateLimitedProcedure
    .input(z.object({ assetId: z.string(), chainId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const asset = await ctx.db
          .select()
          .from(assets)
          .where(
            and(eq(assets.id, input.assetId), eq(assets.chainId, input.chainId))
          )
          .limit(1);

        return asset[0] || null;
      } catch (error) {
        console.error("Failed to fetch asset by ID:", error);
        return null;
      }
    }),

  // Get asset availability and limits
  getAvailability: publicRateLimitedProcedure
    .input(z.object({ assetId: z.string(), chainId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // Get asset details with claim limits
        const assetWithLimits = await ctx.db
          .select({
            asset: assets,
            limits: claimLimits,
          })
          .from(assets)
          .leftJoin(claimLimits, eq(claimLimits.assetId, assets.id))
          .where(
            and(eq(assets.id, input.assetId), eq(assets.chainId, input.chainId))
          )
          .limit(1);

        if (!assetWithLimits[0]) {
          return null;
        }

        const { asset: assetData, limits } = assetWithLimits[0];

        // Calculate today's distributed amount
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayClaims = await ctx.db
          .select({
            totalClaimed: sum(claims.amount),
            claimCount: count(),
          })
          .from(claims)
          .where(
            and(eq(claims.assetId, input.assetId), gte(claims.createdAt, today))
          );

        const totalClaimedToday = todayClaims[0]?.totalClaimed || "0";
        const standardAmount = limits?.standardAmount || "0";
        const maxClaimsPerDay = limits?.maxClaimsPerPeriod || 1;
        const dailyLimit = (
          parseFloat(standardAmount) * maxClaimsPerDay
        ).toString();
        const remaining = Math.max(
          0,
          parseFloat(dailyLimit) - parseFloat(totalClaimedToday)
        ).toString();

        // Get real faucet wallet balance
        const faucetWalletAddress = process.env.FAUCET_WALLET_ADDRESS;
        let balance = "0";

        if (faucetWalletAddress) {
          try {
            // Get chain RPC URL
            const chain = await ctx.db
              .select({ rpcUrl: chains.rpcUrl })
              .from(chains)
              .where(eq(chains.chainId, input.chainId))
              .limit(1);

            const rpcUrl = chain[0]?.rpcUrl;

            if (!rpcUrl) {
              throw new Error(`No RPC URL configured for chain ${input.chainId}`);
            }

            const balanceResult = await balanceService.getAssetBalance(
              faucetWalletAddress,
              assetData.type,
              assetData.address,
              input.chainId,
              assetData.decimals,
              rpcUrl
            );

            balance = balanceResult.formatted;
          } catch (error) {
            console.error("Failed to fetch real balance:", error);
          }
        }

        return {
          assetId: input.assetId,
          chainId: input.chainId,
          isAvailable:
            assetData.isActive &&
            parseFloat(remaining) > 0 &&
            parseFloat(balance) > 0,
          balance,
          dailyLimit,
          remainingToday: remaining,
          nextRefillTime: tomorrow,
          faucetAmount: standardAmount,
        };
      } catch (error) {
        console.error("Failed to fetch asset availability:", error);
        return {
          assetId: input.assetId,
          chainId: input.chainId,
          isAvailable: false,
          balance: "0",
          dailyLimit: "0",
          remainingToday: "0",
          nextRefillTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          faucetAmount: "0",
        };
      }
    }),
});
