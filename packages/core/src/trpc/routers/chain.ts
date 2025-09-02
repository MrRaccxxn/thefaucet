import { z } from "zod";
import { createTRPCRouter, publicRateLimitedProcedure } from "../index";
import { chains } from "@thefaucet/db";
import { eq } from "drizzle-orm";
import { balanceService } from "../../blockchain/balance";

export const chainRouter = createTRPCRouter({
  // Get all supported chains
  getAll: publicRateLimitedProcedure.query(async ({ ctx }) => {
    try {
      const chainList = await ctx.db
        .select()
        .from(chains)
        .where(eq(chains.isActive, true));

      return chainList;
    } catch (error) {
      console.error("Failed to fetch chains:", error);
      return [];
    }
  }),

  // Get specific chain by ID
  getById: publicRateLimitedProcedure
    .input(z.object({ chainId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const chain = await ctx.db
          .select()
          .from(chains)
          .where(eq(chains.chainId, input.chainId))
          .limit(1);

        return chain[0] || null;
      } catch (error) {
        console.error("Failed to fetch chain by ID:", error);
        return null;
      }
    }),

  // Get chain status (balance, connectivity)
  getStatus: publicRateLimitedProcedure
    .input(z.object({ chainId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // Get chain details
        const chain = await ctx.db
          .select()
          .from(chains)
          .where(eq(chains.chainId, input.chainId))
          .limit(1);

        if (!chain[0]) {
          return null;
        }

        const chainData = chain[0];
        const faucetWalletAddress = process.env.FAUCET_WALLET_ADDRESS;
        let isOnline = false;
        let balance = "0";

        if (faucetWalletAddress) {
          try {
            // Check native token balance to verify connectivity
            if (!chainData.rpcUrl) {
              throw new Error(`No RPC URL configured for chain ${input.chainId}`);
            }
            
            const balanceResult = await balanceService.getNativeBalance(
              faucetWalletAddress,
              input.chainId,
              chainData.rpcUrl
            );

            balance = balanceResult.formatted;
            isOnline = true;
          } catch (error) {
            console.error(
              `Chain ${input.chainId} connectivity check failed:`,
              error
            );
            isOnline = false;
          }
        }

        return {
          chainId: input.chainId,
          name: chainData.name,
          symbol: chainData.nativeSymbol,
          isOnline,
          balance,
          isActive: chainData.isActive,
          lastCheck: new Date(),
        };
      } catch (error) {
        console.error("Failed to check chain status:", error);
        return {
          chainId: input.chainId,
          isOnline: false,
          balance: "0",
          lastCheck: new Date(),
        };
      }
    }),
});
