import { TRPCError } from '@trpc/server';
import { middleware } from '../index';
import { rateLimiter } from '../../rate-limiting';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  identifier?: string;
}

export const createRateLimitMiddleware = (config: RateLimitConfig) => {
  return middleware(async (opts) => {
    const { ctx } = opts;
    
    // For claim-specific rate limiting, use the database
    if (config.identifier === 'claim') {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required for claim operations'
        });
      }
      
      // This will be handled by claim-specific logic in claim router
      return opts.next({ ctx });
    }
    
    // Use PostgreSQL-based rate limiting for all API calls
    const identifier = ctx.user?.email || `ip:${opts.ctx.req.headers.get('x-forwarded-for') || 'unknown'}`;
    
    try {
      const result = await rateLimiter.checkLimit(identifier, config);
      
      if (!result.allowed) {
        const secondsUntilReset = Math.ceil((result.resetTime.getTime() - Date.now()) / 1000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Try again in ${secondsUntilReset} seconds.`
        });
      }
      
      return opts.next({ ctx });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      
      // On database error, log and allow request (fail open for API limits)
      console.error('Rate limit check failed:', error);
      return opts.next({ ctx });
    }
  });
};

// Predefined rate limit configurations for different endpoint types
export const rateLimitConfigs = {
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  },
  authenticated: {
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 200 // 200 requests per minute
  },
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 500 // 500 requests per minute
  },
  claim: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 claims per hour
    identifier: 'claim'
  }
};

// Pre-configured middleware instances
export const publicRateLimit = createRateLimitMiddleware(rateLimitConfigs.public);
export const authenticatedRateLimit = createRateLimitMiddleware(rateLimitConfigs.authenticated);
export const adminRateLimit = createRateLimitMiddleware(rateLimitConfigs.admin);
export const claimRateLimit = createRateLimitMiddleware(rateLimitConfigs.claim);