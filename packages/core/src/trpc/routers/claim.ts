import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, claimProcedure } from "../index";
import { claims, assets, chains } from "@thefaucet/db";
import { eq, and, desc, count, gte } from "drizzle-orm";
import { faucetRateLimiter } from "../../rate-limiting";
import { faucetService } from "../../blockchain/faucet";
import type { AuthenticatedUser } from "../../types/auth";
import { getChainConfig, isChainSupported } from "../../config/chains";

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

        return claimResult;
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error Type:', error.constructor.name);
          console.error('Error Message:', error.message);
          console.error('Error Stack:', error.stack);
          
          // Check for specific error types
          if (error.message.includes('PRIVATE_KEY')) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Faucet is not properly configured. Missing PRIVATE_KEY.'
            });
          }
          
          if (error.message.includes('InsufficientBalance')) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'FaucetManager contract has insufficient ETH balance. Please fund it.'
            });
          }
          
          if (error.message.includes('RateLimitExceeded') || error.message.includes('You must wait')) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: error.message
            });
          }
          
          // Include actual error message for debugging
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Claim failed: ${error.message}`
          });
        } else {
          console.error('Unknown error type:', error);
        }
        
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process native token claim - unknown error'
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
        
        const { getDeploymentAddresses } = await import('@thefaucet/contracts');
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

        return claimResult;
      } catch (error) {
        console.error('DevToken claim failed:', error);
        
        // Re-throw TRPC errors with their original messages
        if (error instanceof TRPCError) {
          throw error;
        }
        
        // Handle specific error types with better messages
        if (error instanceof Error) {
          // Check for rate limiting in error message
          if (error.message.includes('Rate limit') || error.message.includes('cooldown')) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: error.message
            });
          }
          
          // Check for deployment/configuration issues
          if (error.message.includes('not deployed') || error.message.includes('deployment')) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: error.message
            });
          }
          
          // Check for private key issues
          if (error.message.includes('PRIVATE_KEY')) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Faucet is not properly configured. Please contact administrator.'
            });
          }
          
          // Check for insufficient balance
          if (error.message.includes('InsufficientBalance')) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Faucet has insufficient token balance. Please contact administrator.'
            });
          }
          
          // Default: include the actual error message for debugging
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `DevToken claim failed: ${error.message}`
          });
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process DevToken claim - unknown error'
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

        return claimResult;
      } catch (error) {
        console.error('ERC20 token claim failed:', error);
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process ERC20 token claim'
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
        const { getDeploymentAddresses } = await import('@thefaucet/contracts');
        const deployment = getDeploymentAddresses(networkName);
        
        if (!deployment?.devNFT) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'DevNFT not deployed on this network'
          });
        }

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

        // Create simple token URI (in production, this should be stored on IPFS)
        const tokenURI = `data:application/json;base64,${Buffer.from(JSON.stringify(input.metadata)).toString('base64')}`;
        
        // Process the NFT mint
        const claimResult = await faucetService.mintNFT(
          input.walletAddress,
          input.chainId,
          chainConfig.rpcUrl
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

        return {
          transactionHash: claimResult.transactionHash,
          tokenId: claimResult.amount,
          estimatedConfirmTime: claimResult.estimatedConfirmTime,
        };
      } catch (error) {
        console.error('NFT mint failed:', error);
        
        // Re-throw TRPC errors with their original messages
        if (error instanceof TRPCError) {
          throw error;
        }
        
        // Handle specific error types with better messages
        if (error instanceof Error) {
          // Check for rate limiting
          if (error.message.includes('Rate limit') || error.message.includes('cooldown')) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: error.message
            });
          }
          
          // Default: include the actual error message for debugging
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `NFT mint failed: ${error.message}`
          });
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process NFT mint - unknown error'
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

  // Get user's current limits and cooldowns
  getLimits: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = (ctx.user as AuthenticatedUser).id;
      const result: Record<string, { remaining: number; cooldownEnds: Date | null }> = {};

      // Get all asset types the user might claim
      const assetTypes = ['native', 'erc20', 'nft'];
      
      for (const assetType of assetTypes) {
        // Check rate limit for this asset type (using default chainId 11155111 for now)
        const rateLimitResult = await faucetRateLimiter.checkLimit({
          userId,
          assetType: assetType as 'native' | 'erc20' | 'nft',
          chainId: 11155111, // Default to Sepolia
          cooldownHours: 24
        });

        result[assetType] = {
          remaining: rateLimitResult.allowed ? 1 : 0,
          cooldownEnds: rateLimitResult.cooldownEnds,
        };
      }

      return result;
    } catch (error) {
      console.error('Failed to fetch user limits:', error);
      return {
        native: { remaining: 0, cooldownEnds: null },
        erc20: { remaining: 0, cooldownEnds: null },
        nft: { remaining: 0, cooldownEnds: null },
      };
    }
  }),
});