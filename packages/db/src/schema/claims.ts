import { pgTable, text, timestamp, integer, uuid, decimal, jsonb, index, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './auth';
import { assets } from './assets';

// Claims table - stores all faucet claims
export const claims = pgTable('claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  walletAddress: text('wallet_address').notNull(),
  amount: decimal('amount', { precision: 30, scale: 18 }), // Amount for native/ERC20 tokens - up to 999,999,999,999.999999999999999999
  tokenId: text('token_id'), // Token ID for NFTs
  txHash: text('tx_hash'),
  status: text('status').notNull().default('pending'), // 'pending', 'confirmed', 'failed'
  metadata: jsonb('metadata'), // Additional metadata for the claim
  createdAt: timestamp('created_at').defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at'),
}, (table) => ({
  userIdIdx: index('claims_user_id_idx').on(table.userId),
  assetIdIdx: index('claims_asset_id_idx').on(table.assetId),
  statusIdx: index('claims_status_idx').on(table.status),
  createdAtIdx: index('claims_created_at_idx').on(table.createdAt),
  txHashIdx: index('claims_tx_hash_idx').on(table.txHash),
}));

// Redeem codes table - for event/hackathon codes
export const redeemCodes = pgTable('redeem_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  description: text('description'),
  maxUses: integer('max_uses').default(1).notNull(),
  currentUses: integer('current_uses').default(0).notNull(),
  expiresAt: timestamp('expires_at'),
  boostedAmounts: jsonb('boosted_amounts'), // JSON object with boosted amounts per asset type
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: index('redeem_codes_code_idx').on(table.code),
  isActiveIdx: index('redeem_codes_is_active_idx').on(table.isActive),
  expiresAtIdx: index('redeem_codes_expires_at_idx').on(table.expiresAt),
}));

// Code redemptions table - tracks which users used which codes
export const codeRedemptions = pgTable('code_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeId: uuid('code_id').references(() => redeemCodes.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  claimId: uuid('claim_id').references(() => claims.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  codeIdIdx: index('code_redemptions_code_id_idx').on(table.codeId),
  userIdIdx: index('code_redemptions_user_id_idx').on(table.userId),
  claimIdIdx: index('code_redemptions_claim_id_idx').on(table.claimId),
}));

// Zod schemas for validation
export const insertClaimSchema = createInsertSchema(claims);
export const selectClaimSchema = createSelectSchema(claims);
export const insertRedeemCodeSchema = createInsertSchema(redeemCodes);
export const selectRedeemCodeSchema = createSelectSchema(redeemCodes);
export const insertCodeRedemptionSchema = createInsertSchema(codeRedemptions);
export const selectCodeRedemptionSchema = createSelectSchema(codeRedemptions);

// Types
export type Claim = z.infer<typeof selectClaimSchema>;
export type NewClaim = z.infer<typeof insertClaimSchema>;
export type RedeemCode = z.infer<typeof selectRedeemCodeSchema>;
export type NewRedeemCode = z.infer<typeof insertRedeemCodeSchema>;
export type CodeRedemption = z.infer<typeof selectCodeRedemptionSchema>;
export type NewCodeRedemption = z.infer<typeof insertCodeRedemptionSchema>;
