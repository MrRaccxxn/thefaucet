import { pgTable, text, timestamp, boolean, integer, uuid, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './auth';

// Legacy Users table - for GitHub OAuth authentication (deprecated, use auth.ts instead)
export const legacyUsers = pgTable('legacy_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubId: text('github_id').unique().notNull(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  githubIdIdx: index('legacy_users_github_id_idx').on(table.githubId),
  emailIdx: index('legacy_users_email_idx').on(table.email),
}));

// User wallets table - for linking multiple wallets to a user
export const userWallets = pgTable('user_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  address: text('address').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_wallets_user_id_idx').on(table.userId),
  addressIdx: index('user_wallets_address_idx').on(table.address),
  isPrimaryIdx: index('user_wallets_is_primary_idx').on(table.isPrimary),
}));

// Rate limiting table - stores claim history for rate limiting
export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  assetType: text('asset_type').notNull(), // 'native', 'erc20', 'nft'
  chainId: integer('chain_id').notNull(),
  lastClaimAt: timestamp('last_claim_at').notNull(),
  claimCount: integer('claim_count').default(0).notNull(),
  resetAt: timestamp('reset_at').notNull(),
}, (table) => ({
  userIdIdx: index('rate_limits_user_id_idx').on(table.userId),
  assetTypeIdx: index('rate_limits_asset_type_idx').on(table.assetType),
  chainIdIdx: index('rate_limits_chain_id_idx').on(table.chainId),
  lastClaimAtIdx: index('rate_limits_last_claim_at_idx').on(table.lastClaimAt),
}));

// API rate limiting table - stores API request history for rate limiting
export const apiRateLimits = pgTable('api_rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(), // user email or IP
  requestCount: integer('request_count').default(0).notNull(),
  windowStart: timestamp('window_start').notNull(),
  windowEnd: timestamp('window_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  identifierIdx: index('api_rate_limits_identifier_idx').on(table.identifier),
  windowEndIdx: index('api_rate_limits_window_end_idx').on(table.windowEnd),
}));

// Zod schemas for validation
export const insertLegacyUserSchema = createInsertSchema(legacyUsers);
export const selectLegacyUserSchema = createSelectSchema(legacyUsers);
export const insertUserWalletSchema = createInsertSchema(userWallets);
export const selectUserWalletSchema = createSelectSchema(userWallets);
export const insertRateLimitSchema = createInsertSchema(rateLimits);
export const selectRateLimitSchema = createSelectSchema(rateLimits);
export const insertApiRateLimitSchema = createInsertSchema(apiRateLimits);
export const selectApiRateLimitSchema = createSelectSchema(apiRateLimits);

// Types
export type LegacyUser = z.infer<typeof selectLegacyUserSchema>;
export type NewLegacyUser = z.infer<typeof insertLegacyUserSchema>;
export type UserWallet = z.infer<typeof selectUserWalletSchema>;
export type NewUserWallet = z.infer<typeof insertUserWalletSchema>;
export type RateLimit = z.infer<typeof selectRateLimitSchema>;
export type NewRateLimit = z.infer<typeof insertRateLimitSchema>;
export type ApiRateLimit = z.infer<typeof selectApiRateLimitSchema>;
export type NewApiRateLimit = z.infer<typeof insertApiRateLimitSchema>;
