// Rate limiting system using PostgreSQL
// Simple PostgreSQL-based rate limiting for MVP

import { db, rateLimits, apiRateLimits } from '@thefaucet/db';
import { eq, and, gte, lt, sql } from 'drizzle-orm';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

export interface FaucetRateLimitConfig {
  userId: string;
  assetType: 'native' | 'erc20' | 'nft';
  chainId: number;
  cooldownHours: number;
}

export interface FaucetRateLimitResult {
  allowed: boolean;
  cooldownEnds: Date | null;
  lastClaimAt: Date | null;
}

export const rateLimiter = {
  checkLimit: async (identifier: string, config: RateLimitConfig): Promise<RateLimitResult> => {
    const now = new Date();
    
    try {
      // Clean up expired entries first
      await db
        .delete(apiRateLimits)
        .where(lt(apiRateLimits.windowEnd, now));
      
      // Check existing rate limit window
      const existing = await db
        .select()
        .from(apiRateLimits)
        .where(
          and(
            eq(apiRateLimits.identifier, identifier),
            gte(apiRateLimits.windowEnd, now)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        const record = existing[0]!;
        
        if (record.requestCount >= config.maxRequests) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: record.windowEnd
          };
        }
        
        // Increment count
        await db
          .update(apiRateLimits)
          .set({ requestCount: record.requestCount + 1 })
          .where(eq(apiRateLimits.id, record.id));
        
        return {
          allowed: true,
          remaining: config.maxRequests - record.requestCount - 1,
          resetTime: record.windowEnd
        };
      }
      
      // Create new window
      const windowEnd = new Date(now.getTime() + config.windowMs);
      await db
        .insert(apiRateLimits)
        .values({
          identifier,
          requestCount: 1,
          windowStart: now,
          windowEnd
        });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: windowEnd
      };
    } catch (error) {
      console.error('API rate limit check failed:', error);
      // Fail open for API limits (allow request on DB error)
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: new Date(now.getTime() + config.windowMs)
      };
    }
  }
};

// Faucet-specific rate limiter (PostgreSQL-based for persistence)
export const faucetRateLimiter = {
  checkLimit: async (config: FaucetRateLimitConfig): Promise<FaucetRateLimitResult> => {
    const now = new Date();
    const cooldownMs = config.cooldownHours * 60 * 60 * 1000;
    const cooldownStart = new Date(now.getTime() - cooldownMs);
    
    try {
      // Check if user has claimed this asset type on this chain recently
      const lastClaim = await db
        .select()
        .from(rateLimits)
        .where(
          and(
            eq(rateLimits.userId, config.userId),
            eq(rateLimits.assetType, config.assetType),
            eq(rateLimits.chainId, config.chainId),
            gte(rateLimits.lastClaimAt, cooldownStart)
          )
        )
        .limit(1);
      
      if (lastClaim.length > 0) {
        const claim = lastClaim[0]!;
        const cooldownEnds = new Date(claim.lastClaimAt.getTime() + cooldownMs);
        
        if (cooldownEnds > now) {
          return {
            allowed: false,
            cooldownEnds,
            lastClaimAt: claim.lastClaimAt
          };
        }
      }
      
      return {
        allowed: true,
        cooldownEnds: null,
        lastClaimAt: lastClaim[0]?.lastClaimAt || null
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail closed - deny access on database errors
      return {
        allowed: false,
        cooldownEnds: null,
        lastClaimAt: null
      };
    }
  },
  
  recordClaim: async (config: FaucetRateLimitConfig): Promise<void> => {
    const now = new Date();
    const resetAt = new Date(now.getTime() + config.cooldownHours * 60 * 60 * 1000);
    
    try {
      // Insert new rate limit record
      await db
        .insert(rateLimits)
        .values({
          userId: config.userId,
          assetType: config.assetType,
          chainId: config.chainId,
          lastClaimAt: now,
          claimCount: 1,
          resetAt
        });
    } catch (error) {
      console.error('Failed to record claim:', error);
      throw new Error('Failed to update rate limit');
    }
  },
  
  cleanup: async (): Promise<number> => {
    // Clean up old rate limit records (older than 7 days)
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    try {
      const result = await db
        .delete(rateLimits)
        .where(lt(rateLimits.resetAt, cutoff));
      
      return result.length || 0;
    } catch (error) {
      console.error('Rate limit cleanup failed:', error);
      return 0;
    }
  }
};
