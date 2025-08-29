// Export all schema tables and types
export * from './schema/users';
export * from './schema/chains';
export * from './schema/assets';
export * from './schema/claims';

// Import all tables for migrations
import { users, userWallets, rateLimits } from './schema/users';
import { chains } from './schema/chains';
import { assets, claimLimits } from './schema/assets';
import { claims, redeemCodes, codeRedemptions } from './schema/claims';

// Export all tables for migrations
export const tables = {
  users,
  userWallets,
  rateLimits,
  chains,
  assets,
  claimLimits,
  claims,
  redeemCodes,
  codeRedemptions,
};
