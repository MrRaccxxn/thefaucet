import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, claimProcedure } from "../index";
import { claims, assets, chains, userWallets, rateLimits } from "@thefaucet/db";
import { eq, and, desc, count, gte } from "drizzle-orm";
import { faucetRateLimiter } from "../../rate-limiting";
import { faucetService } from "../../blockchain/faucet";
import type { AuthenticatedUser } from "../../types/auth";
import { getChainConfig, isChainSupported } from "../../config/chains";
import { ethers } from "ethers";
import { ABIS, getDeploymentAddresses } from "@thefaucet/contract-artifacts";
import { handleClaimError, handleDatabaseError } from "../../utils/error-handler";

const CHAIN_NAMES: Record<number, string> = {
  11155111: "sepolia",
  4202: "lisk-sepolia",
  80002: "amoy",
  97: "bsc-testnet",
};

// Simple in-memory cache for blockchain cooldown checks
// Key: `${chainId}-${walletAddress}`, Value: { canClaim, cooldownSeconds, timestamp }
const blockchainCooldownCache = new Map<string, { canClaim: boolean; cooldownSeconds: number; timestamp: number }>();
const CACHE_TTL_MS = 60000; // 1 minute cache

// Helper function to invalidate cache for a specific user/chain/asset
function invalidateBlockchainCache(chainId: number, walletAddress: string, assetType: 'native' | 'erc20' | 'nft', contractAddress?: string) {
  const cacheKey = `${chainId}-${walletAddress}-${assetType}${contractAddress ? '-' + contractAddress : ''}`;
  blockchainCooldownCache.delete(cacheKey);
  console.log(`[BLOCKCHAIN CACHE] Invalidated cache for ${assetType} asset: ${walletAddress} on chain ${chainId}`);
}

// Helper function to check blockchain cooldown for any asset type with caching
async function checkBlockchainCooldown(chainId: number, walletAddress: string, assetType: 'native' | 'erc20' | 'nft', contractAddress?: string) {
  const cacheKey = `${chainId}-${walletAddress}-${assetType}${contractAddress ? '-' + contractAddress : ''}`;
  const now = Date.now();
  
  // Check cache first
  const cached = blockchainCooldownCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    console.log(`[BLOCKCHAIN CACHE] Using cached result for ${walletAddress} on chain ${chainId}`);
    return { canClaim: cached.canClaim, cooldownSeconds: cached.cooldownSeconds };
  }

  try {
    const networkName = CHAIN_NAMES[chainId];
    if (!networkName) {
      return { canClaim: true, cooldownSeconds: 0 };
    }

    const deployment = getDeploymentAddresses(networkName);
    if (!deployment) {
      return { canClaim: true, cooldownSeconds: 0 };
    }

    const chainConfig = getChainConfig(chainId);
    if (!chainConfig) {
      return { canClaim: true, cooldownSeconds: 0 };
    }

    console.log(`[BLOCKCHAIN] Querying blockchain for ${assetType} asset: ${walletAddress} on chain ${chainId}`);
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
    
    let canClaim = true;
    let cooldownSeconds = 0;

    if (assetType === 'native') {
      const faucetManager = new ethers.Contract(
        deployment.faucetManager,
        ABIS.FaucetManager,
        provider
      );

      // Check if user can claim native tokens
      const canClaimFunction = faucetManager.getFunction("canClaimNative");
      canClaim = await canClaimFunction(walletAddress);

      // Get remaining cooldown time for native tokens
      const getCooldownFunction = faucetManager.getFunction("getNativeCooldown");
      cooldownSeconds = await getCooldownFunction(walletAddress);
    } else if (assetType === 'erc20' && contractAddress) {
      // For ERC20 tokens, check the specific token contract
      try {
        const tokenContract = new ethers.Contract(
          contractAddress,
          ABIS.DevToken, // Assuming DevToken ABI for ERC20 tokens
          provider
        );

        // Check if the contract has a cooldown check method
        // Many token contracts have `lastClaimTime` or similar methods
        const lastClaimTimeFunction = tokenContract.getFunction("lastClaimTime");
        const lastClaimTime = await lastClaimTimeFunction(walletAddress);
        const lastClaimTimeMs = Number(lastClaimTime) * 1000;
        
        // Assuming 24 hour cooldown for ERC20 tokens
        const cooldownPeriodMs = 24 * 60 * 60 * 1000;
        const timeElapsed = Date.now() - lastClaimTimeMs;
        
        if (timeElapsed < cooldownPeriodMs) {
          canClaim = false;
          cooldownSeconds = Math.ceil((cooldownPeriodMs - timeElapsed) / 1000);
        }
      } catch (error) {
        // If contract doesn't have cooldown methods, assume it's allowed
        console.log(`[BLOCKCHAIN] ERC20 contract ${contractAddress} doesn't have cooldown methods, allowing claim`);
        canClaim = true;
        cooldownSeconds = 0;
      }
    } else if (assetType === 'nft' && contractAddress) {
      // For NFTs, check the specific NFT contract
      try {
        const nftContract = new ethers.Contract(
          contractAddress,
          ABIS.DevNFT, // Assuming DevNFT ABI for NFT contracts
          provider
        );

        // Check if the contract has a cooldown check method
        const lastMintTimeFunction = nftContract.getFunction("lastMintTime");
        const lastMintTime = await lastMintTimeFunction(walletAddress);
        const lastMintTimeMs = Number(lastMintTime) * 1000;
        
        // Assuming 24 hour cooldown for NFTs
        const cooldownPeriodMs = 24 * 60 * 60 * 1000;
        const timeElapsed = Date.now() - lastMintTimeMs;
        
        if (timeElapsed < cooldownPeriodMs) {
          canClaim = false;
          cooldownSeconds = Math.ceil((cooldownPeriodMs - timeElapsed) / 1000);
        }
      } catch (error) {
        // If contract doesn't have cooldown methods, assume it's allowed
        console.log(`[BLOCKCHAIN] NFT contract ${contractAddress} doesn't have cooldown methods, allowing claim`);
        canClaim = true;
        cooldownSeconds = 0;
      }
    }

    const result = {
      canClaim: Boolean(canClaim),
      cooldownSeconds: Number(cooldownSeconds)
    };

    // Cache the result
    blockchainCooldownCache.set(cacheKey, { ...result, timestamp: now });
    
    return result;
  } catch (error) {
    console.error(`Failed to check blockchain cooldown for ${assetType}:`, error);
    return { canClaim: true, cooldownSeconds: 0 };
  }
}

// Helper function to sync database with blockchain state
async function syncDatabaseWithBlockchain(
  db: any, 
  userId: string, 
  chainId: number, 
  assetType: 'native' | 'erc20' | 'nft', 
  blockchainResult: { canClaim: boolean; cooldownSeconds: number }
) {
  if (blockchainResult.cooldownSeconds > 0) {
    // Calculate when the claim happened based on remaining cooldown
    const claimTime = new Date(Date.now() - (24 * 60 * 60 * 1000) + blockchainResult.cooldownSeconds * 1000);
    const resetAt = new Date(claimTime.getTime() + 24 * 60 * 60 * 1000);
    
    try {
      // Insert rate limit record directly with the correct timestamp
      await db.insert(rateLimits).values({
        userId,
        assetType,
        chainId,
        lastClaimAt: claimTime,
        claimCount: 1,
        resetAt
      });
      console.log(`[BLOCKCHAIN SYNC] Updated database with blockchain state for ${assetType} on chain ${chainId}`);
    } catch (syncError) {
      console.error(`[BLOCKCHAIN SYNC] Failed to sync database for ${assetType}:`, syncError);
    }
  }
}

export const claimRouter = createTRPCRouter({
  // Claim native tokens
  claimNative: claimProcedure
    .input(
      z.object({
        chainId: z.number(),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = (ctx.user as AuthenticatedUser).id;

        // Check rate limiting
        console.log('Checking rate limit for native tokens:', {
          userId,
          assetType: 'native',
          chainId: input.chainId,
          cooldownHours: 24
        });
        
        const rateLimitResult = await faucetRateLimiter.checkLimit({
          userId,
          assetType: 'native',
          chainId: input.chainId,
          cooldownHours: 24
        });
        
        console.log('Rate limit result for native tokens:', {
          allowed: rateLimitResult.allowed,
          cooldownEnds: rateLimitResult.cooldownEnds,
          lastClaimAt: rateLimitResult.lastClaimAt
        });

        // If database rate limiting says it's allowed, also check claims table for recent native claims
        // This handles cases where old claims weren't recorded in rate_limits table
        if (rateLimitResult.allowed) {
          console.log('Database rate limit allowed, checking claims table for recent native claims...');
          console.log('Checking for wallet address:', input.walletAddress);
          
          const recentClaims = await ctx.db
            .select()
            .from(claims)
            .innerJoin(assets, eq(claims.assetId, assets.id))
            .where(and(
              eq(claims.walletAddress, input.walletAddress), // Check by wallet address, not userId
              eq(assets.type, 'native'),
              eq(assets.chainId, input.chainId),
              gte(claims.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // 24 hours ago
            ))
            .limit(1);
            
          console.log('Recent native claims found:', recentClaims.length);
          
          if (recentClaims.length > 0) {
            const lastClaim = recentClaims[0]!;
            const claimTime = new Date(lastClaim.claims.createdAt);
            const canClaimAt = new Date(claimTime.getTime() + 24 * 60 * 60 * 1000);
            const now = new Date();
            
            console.log('Found recent claim:', {
              claimTime: claimTime.toISOString(),
              canClaimAt: canClaimAt.toISOString(),
              now: now.toISOString()
            });
            
            if (canClaimAt > now) {
              const timeRemainingMs = canClaimAt.getTime() - now.getTime();
              const totalMinutes = Math.ceil(timeRemainingMs / 1000 / 60);
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              
              let timeMessage;
              if (hours > 0) {
                timeMessage = minutes > 0 
                  ? `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
                  : `${hours} hour${hours !== 1 ? 's' : ''}`;
              } else {
                timeMessage = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
              }
              
              throw new TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: `You have already claimed native tokens on this network. Please wait ${timeMessage} before claiming again.`
              });
            }
          }
        }

        if (!rateLimitResult.allowed) {
          const timeRemainingMs = rateLimitResult.cooldownEnds 
            ? rateLimitResult.cooldownEnds.getTime() - Date.now()
            : 0;
          
          const totalMinutes = Math.ceil(timeRemainingMs / 1000 / 60);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          
          let timeMessage;
          if (hours > 0) {
            timeMessage = minutes > 0 
              ? `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
              : `${hours} hour${hours !== 1 ? 's' : ''}`;
          } else {
            timeMessage = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
          }
          
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `You have already claimed native tokens on this network. Please wait ${timeMessage} before claiming again.`
          });
        }

        // Get chain details from static config
        console.log('[DEBUG] Claiming for chainId:', input.chainId);
        
        const chainConfig = getChainConfig(input.chainId);
        console.log('[DEBUG] Found chain config:', chainConfig);

        if (!chainConfig || !chainConfig.isActive) {
          console.error('[DEBUG] Chain not supported or inactive. ChainId:', input.chainId);
          
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Chain not supported or inactive (chainId: ${input.chainId})`
          });
        }

        const amount = process.env.NATIVE_TOKEN_AMOUNT || "0.05";
        
        // Process the claim
        const claimResult = await faucetService.claimNativeToken(
          input.walletAddress,
          input.chainId,
          chainConfig.rpcUrl
        );

        // Get a dummy asset ID for native token (we'll create one or use existing)
        const nativeAssets = await ctx.db
          .select({ id: assets.id })
          .from(assets)
          .where(and(
            eq(assets.type, 'native'),
            eq(assets.chainId, input.chainId)
          ))
          .limit(1);

        let nativeAssetId = nativeAssets[0]?.id;
        if (!nativeAssetId) {
          // Create native asset if it doesn't exist
          const newNativeAsset = await ctx.db
            .insert(assets)
            .values({
              chainId: input.chainId,
              type: 'native',
              address: null,
              symbol: chainConfig.nativeSymbol,
              name: `${chainConfig.name} Native Token`,
              decimals: 18,
              isActive: true
            })
            .returning();
          nativeAssetId = newNativeAsset[0]!.id;
        }

        // Record the claim in database
        const newClaim = await ctx.db
          .insert(claims)
          .values({
            userId,
            assetId: nativeAssetId,
            walletAddress: input.walletAddress,
            amount,
            txHash: claimResult.transactionHash,
            status: 'pending'
          })
          .returning();

        // Record rate limit
        console.log('Recording rate limit for native claim:', {
          userId,
          assetType: 'native',
          chainId: input.chainId,
          cooldownHours: 24
        });
        
        await faucetRateLimiter.recordClaim({
          userId,
          assetType: 'native',
          chainId: input.chainId,
          cooldownHours: 24
        });
        
        console.log('Rate limit recorded successfully');

        // Invalidate blockchain cache since user just successfully claimed
        invalidateBlockchainCache(input.chainId, input.walletAddress, 'native');

        return claimResult;
      } catch (error) {
        // Re-throw existing TRPCErrors (e.g., rate limiting, validation)
        if (error instanceof TRPCError) throw error;
        
        // Handle and convert technical errors to user-friendly messages
        const userMessage = handleClaimError(error, 'claimNative');
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: userMessage
        });
      }
    }),

  // Claim DevToken (simplified for dev tokens)
  claimDevToken: claimProcedure
    .input(
      z.object({
        chainId: z.number(),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = (ctx.user as AuthenticatedUser).id;
        
        console.log('DevToken claim attempt:', {
          userId,
          chainId: input.chainId,
          walletAddress: input.walletAddress,
          timestamp: new Date().toISOString()
        });

        // Check rate limiting
        const rateLimitResult = await faucetRateLimiter.checkLimit({
          userId,
          assetType: 'erc20',
          chainId: input.chainId,
          cooldownHours: 24
        });
        
        console.log('Rate limit check result:', {
          allowed: rateLimitResult.allowed,
          cooldownEnds: rateLimitResult.cooldownEnds,
          lastClaimAt: rateLimitResult.lastClaimAt
        });

        if (!rateLimitResult.allowed) {
          const timeRemainingMs = rateLimitResult.cooldownEnds 
            ? rateLimitResult.cooldownEnds.getTime() - Date.now()
            : 0;
          
          const totalMinutes = Math.ceil(timeRemainingMs / 1000 / 60);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          
          let timeMessage;
          if (hours > 0) {
            timeMessage = minutes > 0 
              ? `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
              : `${hours} hour${hours !== 1 ? 's' : ''}`;
          } else {
            timeMessage = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
          }
          
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `You have already claimed DEV tokens on this network. Please wait ${timeMessage} before claiming again.`
          });
        }

        // Get chain details from static config
        const chainConfig = getChainConfig(input.chainId);

        if (!chainConfig || !chainConfig.isActive) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Chain not supported or inactive'
          });
        }

        // Get deployed DevToken address from contracts config
        // Use the chain id to get the network name (e.g., 'lisk-sepolia')
        const networkName = chainConfig.id;
        console.log('Looking up deployment for network:', networkName);
        
        const { getDeploymentAddresses } = await import('@thefaucet/contract-artifacts');
        const deployment = getDeploymentAddresses(networkName);
        
        console.log('Deployment found:', deployment ? 'yes' : 'no', {
          networkName,
          devToken: deployment?.devToken,
          faucetManager: deployment?.faucetManager
        });
        
        if (!deployment?.devToken) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `DevToken not deployed on network: ${networkName}. Only Lisk Sepolia is currently supported for DEV tokens.`
          });
        }

        // Find or create DevToken asset
        const existingAssets = await ctx.db
          .select()
          .from(assets)
          .where(and(
            eq(assets.chainId, input.chainId),
            eq(assets.type, 'erc20'),
            eq(assets.address, deployment.devToken)
          ))
          .limit(1);

        let assetId: string;
        if (existingAssets[0]) {
          assetId = existingAssets[0].id;
        } else {
          // Create the DevToken asset
          const newAsset = await ctx.db
            .insert(assets)
            .values({
              chainId: input.chainId,
              type: 'erc20',
              address: deployment.devToken,
              symbol: 'DEV',
              name: 'DevToken',
              decimals: 18,
              isActive: true
            })
            .returning();
          assetId = newAsset[0]!.id;
        }

        const amountInTokens = process.env.ERC20_TOKEN_AMOUNT || "100";
        
        console.log('Claiming ERC20 tokens:', {
          amountInTokens,
          chainId: input.chainId,
          walletAddress: input.walletAddress
        });
        
        // Process the claim
        const claimResult = await faucetService.claimERC20Token(
          input.walletAddress,
          amountInTokens,
          input.chainId,
          chainConfig.rpcUrl
        );
        
        console.log('Claim result:', claimResult);

        // Record the claim in database
        // Store the amount as a decimal string (not in wei for database)
        console.log('Database insertion values:', {
          userId,
          assetId,
          walletAddress: input.walletAddress,
          amount: amountInTokens,
          txHash: claimResult.transactionHash,
          status: 'pending',
          // Check field lengths
          userIdLength: userId.length,
          assetIdLength: assetId.length,
          walletAddressLength: input.walletAddress.length,
          amountLength: amountInTokens.length,
          txHashLength: claimResult.transactionHash?.length || 0
        });

        // Validate amount is within decimal(30, 18) limits
        const numAmount = parseFloat(amountInTokens);
        if (numAmount > 999999999999.999999999999999999) { // 12 digits before decimal + 18 after
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Amount ${amountInTokens} exceeds database field limits (max: 999,999,999,999 tokens)`
          });
        }

        try {
          await ctx.db
            .insert(claims)
            .values({
              userId,
              assetId,
              walletAddress: input.walletAddress,
              amount: amountInTokens, // Store as "100" - let the DB handle conversion
              txHash: claimResult.transactionHash,
              status: 'pending'
            });
        } catch (dbError) {
          console.error('Database insertion failed:', dbError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Database error during claim recording: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
          });
        }

        // Record rate limit
        await faucetRateLimiter.recordClaim({
          userId,
          assetType: 'erc20',
          chainId: input.chainId,
          cooldownHours: 24
        });

        // Invalidate blockchain cache since user just successfully claimed
        // For DevToken, use the default deployment address
        const devTokenNetworkName = CHAIN_NAMES[input.chainId];
        const devTokenDeployment = devTokenNetworkName ? getDeploymentAddresses(devTokenNetworkName) : null;
        invalidateBlockchainCache(input.chainId, input.walletAddress, 'erc20', devTokenDeployment?.devToken);

        return claimResult;
      } catch (error) {
        console.error('DevToken claim failed:', error);
        
        // Re-throw existing TRPCErrors (e.g., rate limiting, validation)
        if (error instanceof TRPCError) throw error;
        
        // Handle and convert technical errors to user-friendly messages
        const userMessage = handleClaimError(error, 'claimDevToken');
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: userMessage
        });
      }
    }),

  // Claim ERC20 tokens (generic - requires assetId)
  claimERC20: claimProcedure
    .input(
      z.object({
        chainId: z.number(),
        assetId: z.string(),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = (ctx.user as AuthenticatedUser).id;

        // Check rate limiting
        const rateLimitResult = await faucetRateLimiter.checkLimit({
          userId,
          assetType: 'erc20',
          chainId: input.chainId,
          cooldownHours: 24
        });

        if (!rateLimitResult.allowed) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Rate limit exceeded. Next claim available at ${rateLimitResult.cooldownEnds?.toISOString()}`
          });
        }

        // Get asset details
        const asset = await ctx.db
          .select()
          .from(assets)
          .where(and(
            eq(assets.id, input.assetId),
            eq(assets.chainId, input.chainId),
            eq(assets.type, 'erc20')
          ))
          .limit(1);

        if (!asset[0] || !asset[0].isActive) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Asset not found or inactive'
          });
        }

        // Get chain details from static config
        const chainConfig = getChainConfig(input.chainId);

        if (!chainConfig || !chainConfig.isActive) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Chain not supported or inactive'
          });
        }

        const amount = process.env.ERC20_TOKEN_AMOUNT || "1000";
        
        // Process the claim
        const claimResult = await faucetService.claimERC20Token(
          input.walletAddress,
          amount,
          input.chainId,
          chainConfig.rpcUrl
        );

        // Record the claim in database
        await ctx.db
          .insert(claims)
          .values({
            userId,
            assetId: input.assetId,
            walletAddress: input.walletAddress,
            amount,
            txHash: claimResult.transactionHash,
            status: 'pending'
          });

        // Record rate limit
        await faucetRateLimiter.recordClaim({
          userId,
          assetType: 'erc20',
          chainId: input.chainId,
          cooldownHours: 24
        });

        // Invalidate blockchain cache since user just successfully claimed
        invalidateBlockchainCache(input.chainId, input.walletAddress, 'erc20', asset[0].address || undefined);

        return claimResult;
      } catch (error) {
        console.error('ERC20 token claim failed:', error);
        
        // Re-throw existing TRPCErrors (e.g., rate limiting, validation)
        if (error instanceof TRPCError) throw error;
        
        // Handle and convert technical errors to user-friendly messages
        const userMessage = handleClaimError(error, 'claimERC20');
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: userMessage
        });
      }
    }),

  // Mint NFT
  mintNFT: claimProcedure
    .input(
      z.object({
        chainId: z.number(),
        collectionId: z.string(),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
        metadata: z.object({
          name: z.string(),
          description: z.string(),
          image: z.string().url().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = (ctx.user as AuthenticatedUser).id;

        // Check rate limiting
        const rateLimitResult = await faucetRateLimiter.checkLimit({
          userId,
          assetType: 'nft',
          chainId: input.chainId,
          cooldownHours: 24
        });

        console.log("rateLimitResult", rateLimitResult);

        if (!rateLimitResult.allowed) {
          const timeRemainingMs = rateLimitResult.cooldownEnds 
            ? rateLimitResult.cooldownEnds.getTime() - Date.now()
            : 0;
          
          const totalMinutes = Math.ceil(timeRemainingMs / 1000 / 60);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          
          let timeMessage;
          if (hours > 0) {
            timeMessage = minutes > 0 
              ? `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
              : `${hours} hour${hours !== 1 ? 's' : ''}`;
          } else {
            timeMessage = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
          }
          
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `You have already minted an NFT on this network. Please wait ${timeMessage} before minting again.`
          });
        }

        // Get chain details first to get deployed NFT address
        const chainConfig = getChainConfig(input.chainId);

        if (!chainConfig || !chainConfig.isActive) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Chain not supported or inactive'
          });
        }

        // Get deployed DevNFT address from contracts config
        const networkName = chainConfig.id;
        const { getDeploymentAddresses } = await import('@thefaucet/contract-artifacts');
        const deployment = getDeploymentAddresses(networkName);
        
        if (!deployment?.devNFT) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `NFT minting is currently only available on Lisk Sepolia. Please switch to Lisk Sepolia network to mint NFTs.`
          });
        }

        console.log("deployment NFT", deployment);

        // Find or create NFT collection asset
        const nftAssets = await ctx.db
          .select()
          .from(assets)
          .where(and(
            eq(assets.chainId, input.chainId),
            eq(assets.type, 'nft'),
            eq(assets.address, deployment.devNFT)
          ))
          .limit(1);

        let assetId: string;
        if (nftAssets[0]) {
          assetId = nftAssets[0].id;
        } else {
          // Create the DevNFT asset
          const newAsset = await ctx.db
            .insert(assets)
            .values({
              chainId: input.chainId,
              type: 'nft',
              address: deployment.devNFT,
              symbol: 'DEVNFT',
              name: 'Developer NFT Collection',
              decimals: 0,
              isActive: true
            })
            .returning();
          assetId = newAsset[0]!.id;
        }
        
        // Process the NFT mint with metadata
        const claimResult = await faucetService.mintNFT(
          input.walletAddress,
          input.chainId,
          chainConfig.rpcUrl,
          input.metadata
        );

        // Record the claim in database
        await ctx.db
          .insert(claims)
          .values({
            userId,
            assetId,
            walletAddress: input.walletAddress,
            tokenId: claimResult.amount, // tokenId stored as amount for NFTs
            txHash: claimResult.transactionHash,
            status: 'pending',
            metadata: input.metadata
          });

        // Record rate limit
        await faucetRateLimiter.recordClaim({
          userId,
          assetType: 'nft',
          chainId: input.chainId,
          cooldownHours: 24
        });

        // Invalidate blockchain cache since user just successfully claimed
        invalidateBlockchainCache(input.chainId, input.walletAddress, 'nft', deployment.devNFT);

        return {
          transactionHash: claimResult.transactionHash,
          tokenId: claimResult.amount,
          estimatedConfirmTime: claimResult.estimatedConfirmTime,
        };
      } catch (error) {
        console.error('NFT mint failed:', error);
        
        // Re-throw existing TRPCErrors (e.g., rate limiting, validation)
        if (error instanceof TRPCError) throw error;
        
        // Handle and convert technical errors to user-friendly messages
        const userMessage = handleClaimError(error, 'mintNFT');
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: userMessage
        });
      }
    }),

  // Get user's claim history
  getHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        chainId: z.number().optional(),
        assetType: z.enum(["native", "erc20", "nft"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const offset = (input.page - 1) * input.limit;
        const userId = (ctx.user as AuthenticatedUser).id;

        // Build where conditions
        let whereConditions = eq(claims.userId, userId);
        
        if (input.chainId) {
          whereConditions = and(whereConditions, eq(assets.chainId, input.chainId))!;
        }

        if (input.assetType) {
          whereConditions = and(whereConditions, eq(assets.type, input.assetType))!;
        }

        // Get claims with asset details
        const userClaims = await ctx.db
          .select({
            claim: claims,
            asset: assets
          })
          .from(claims)
          .leftJoin(assets, eq(claims.assetId, assets.id))
          .where(whereConditions)
          .orderBy(desc(claims.createdAt))
          .limit(input.limit)
          .offset(offset);

        // Get total count
        const totalResult = await ctx.db
          .select({ count: count() })
          .from(claims)
          .leftJoin(assets, eq(claims.assetId, assets.id))
          .where(whereConditions);

        const total = totalResult[0]?.count || 0;

        return {
          claims: userClaims.map(({ claim, asset }) => ({
            ...claim,
            asset
          })),
          total,
          page: input.page,
          limit: input.limit,
          hasMore: offset + input.limit < total,
        };
      } catch (error) {
        console.error('Failed to fetch claim history:', error);
        return {
          claims: [],
          total: 0,
          page: input.page,
          limit: input.limit,
          hasMore: false,
        };
      }
    }),

  // Get user's current limits and cooldowns for a specific chain
  getLimits: protectedProcedure
    .input(
      z.object({
        chainId: z.number(),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const userId = (ctx.user as AuthenticatedUser).id;
        const result: Record<string, { remaining: number; cooldownEnds: Date | null; timeRemaining: string | null }> = {};

        // Get user's primary wallet address if not provided
        let walletAddress = input.walletAddress;
        if (!walletAddress) {
          const primaryWallet = await ctx.db.select().from(userWallets)
            .where(and(
              eq(userWallets.userId, userId),
              eq(userWallets.isPrimary, true)
            ))
            .limit(1);
          walletAddress = primaryWallet[0]?.address;
        }

        // Get all asset types the user might claim
        const assetTypes: ('native' | 'erc20' | 'nft')[] = ['native', 'erc20', 'nft'];
        
        for (const assetType of assetTypes) {
          // Check rate limit for this asset type
          const rateLimitResult = await faucetRateLimiter.checkLimit({
            userId,
            assetType: assetType as 'native' | 'erc20' | 'nft',
            chainId: input.chainId,
            cooldownHours: 24
          });

          let finalResult = rateLimitResult;
          let timeRemaining: string | null = null;

          // DATABASE-FIRST OPTIMIZATION: Only check blockchain when database says "allowed"
          // This minimizes expensive blockchain calls as requested
          if (rateLimitResult.allowed && walletAddress) {
            console.log(`[RATE LIMITING] Database allows ${assetType} claim for user ${userId}, checking blockchain for sync`);
            
            // Get contract addresses for ERC20 and NFT assets if needed
            let contractAddress: string | undefined;
            if (assetType === 'erc20' || assetType === 'nft') {
              // For now, we'll get the default contract addresses from deployment
              // TODO: In production, you might want to query specific assets from database
              const networkName = CHAIN_NAMES[input.chainId];
              if (networkName) {
                const deployment = getDeploymentAddresses(networkName);
                if (deployment) {
                  contractAddress = assetType === 'erc20' ? deployment.devToken : deployment.devNFT;
                }
              }
            }
            
            const blockchainResult = await checkBlockchainCooldown(input.chainId, walletAddress, assetType, contractAddress);
            
            if (!blockchainResult.canClaim && blockchainResult.cooldownSeconds > 0) {
              // Blockchain disagrees with database - blockchain has the truth
              console.log(`[BLOCKCHAIN SYNC] Database-blockchain mismatch for ${assetType}. DB: allowed, Blockchain: ${blockchainResult.cooldownSeconds}s remaining`);
              
              const cooldownEnds = new Date(Date.now() + blockchainResult.cooldownSeconds * 1000);
              finalResult = {
                allowed: false,
                cooldownEnds,
                lastClaimAt: new Date(Date.now() - (24 * 60 * 60 * 1000) + blockchainResult.cooldownSeconds * 1000)
              };

              // Sync database with blockchain state to prevent future discrepancies
              await syncDatabaseWithBlockchain(ctx.db, userId, input.chainId, assetType, blockchainResult);
            } else {
              console.log(`[RATE LIMITING] Database and blockchain in sync for ${assetType}. User can claim.`);
            }
          } else {
            // Database says not allowed - trust database completely, no blockchain call needed
            console.log(`[RATE LIMITING] Database denies ${assetType} claim for user ${userId}. Blockchain call skipped (cost optimization).`);
          }

          // Calculate human-readable time remaining
          if (!finalResult.allowed && finalResult.cooldownEnds) {
            const now = new Date();
            const timeRemainingMs = finalResult.cooldownEnds.getTime() - now.getTime();
            
            if (timeRemainingMs > 0) {
              const totalMinutes = Math.ceil(timeRemainingMs / 1000 / 60);
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              
              if (hours > 0) {
                timeRemaining = minutes > 0 
                  ? `${hours}h ${minutes}m`
                  : `${hours}h`;
              } else {
                timeRemaining = `${minutes}m`;
              }
            }
          }

          result[assetType] = {
            remaining: finalResult.allowed ? 1 : 0,
            cooldownEnds: finalResult.cooldownEnds,
            timeRemaining,
          };
        }

        return result;
      } catch (error) {
        console.error('Failed to fetch user limits:', error);
        return {
          native: { remaining: 0, cooldownEnds: null, timeRemaining: null },
          erc20: { remaining: 0, cooldownEnds: null, timeRemaining: null },
          nft: { remaining: 0, cooldownEnds: null, timeRemaining: null },
        };
      }
    }),
});