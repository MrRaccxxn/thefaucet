import { pgTable, text, timestamp, boolean, integer, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table - for GitHub OAuth authentication
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubId: text('github_id').unique().notNull(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User wallets table - for linking multiple wallets to a user
export const userWallets = pgTable('user_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  address: text('address').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Rate limiting table - stores claim history for rate limiting
export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  assetType: text('asset_type').notNull(), // 'native', 'erc20', 'nft'
  chainId: integer('chain_id').notNull(),
  lastClaimAt: timestamp('last_claim_at').notNull(),
  claimCount: integer('claim_count').default(0).notNull(),
  resetAt: timestamp('reset_at').notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertUserWalletSchema = createInsertSchema(userWallets);
export const selectUserWalletSchema = createSelectSchema(userWallets);
export const insertRateLimitSchema = createInsertSchema(rateLimits);
export const selectRateLimitSchema = createSelectSchema(rateLimits);

// Types
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type UserWallet = z.infer<typeof selectUserWalletSchema>;
export type NewUserWallet = z.infer<typeof insertUserWalletSchema>;
export type RateLimit = z.infer<typeof selectRateLimitSchema>;
export type NewRateLimit = z.infer<typeof insertRateLimitSchema>;
