import { pgTable, text, timestamp, integer, uuid, decimal, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';

// Claims table - stores all faucet claims
export const claims = pgTable('claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  walletAddress: text('wallet_address').notNull(),
  chainId: integer('chain_id').notNull(),
  assetType: text('asset_type').notNull(), // 'native', 'erc20', 'nft'
  assetAddress: text('asset_address'), // Contract address for ERC20/NFT, null for native
  amount: decimal('amount'), // Amount for native/ERC20 tokens
  tokenId: text('token_id'), // Token ID for NFTs
  txHash: text('tx_hash'),
  status: text('status').notNull().default('pending'), // 'pending', 'confirmed', 'failed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at'),
});

// Redeem codes table - for event/hackathon codes
export const redeemCodes = pgTable('redeem_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').unique().notNull(),
  description: text('description'),
  maxUses: integer('max_uses').default(1).notNull(),
  currentUses: integer('current_uses').default(0).notNull(),
  expiresAt: timestamp('expires_at'),
  boostedAmounts: jsonb('boosted_amounts'), // JSON object with boosted amounts per asset type
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Code redemptions table - tracks which users used which codes
export const codeRedemptions = pgTable('code_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeId: uuid('code_id').references(() => redeemCodes.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  claimId: uuid('claim_id').references(() => claims.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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
