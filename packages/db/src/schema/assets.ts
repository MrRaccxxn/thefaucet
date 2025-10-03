import { pgTable, text, timestamp, integer, uuid, boolean, decimal, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { chains } from './chains';

// Assets table - stores supported tokens and NFTs
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  chainId: integer('chain_id').references(() => chains.chainId, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'native', 'erc20', 'nft'
  address: text('address'), // Contract address for ERC20/NFT, null for native
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  decimals: integer('decimals').default(18).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  chainIdIdx: index('assets_chain_id_idx').on(table.chainId),
  typeIdx: index('assets_type_idx').on(table.type),
  addressIdx: index('assets_address_idx').on(table.address),
  isActiveIdx: index('assets_is_active_idx').on(table.isActive),
}));

// Claim limits table - stores rate limiting configuration per asset
export const claimLimits = pgTable('claim_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  standardAmount: decimal('standard_amount', { precision: 30, scale: 18 }).notNull(),
  cooldownPeriod: integer('cooldown_period').notNull(), // in hours
  maxClaimsPerPeriod: integer('max_claims_per_period').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  assetIdIdx: index('claim_limits_asset_id_idx').on(table.assetId),
}));

// Zod schemas for validation
export const insertAssetSchema = createInsertSchema(assets);
export const selectAssetSchema = createSelectSchema(assets);
export const insertClaimLimitSchema = createInsertSchema(claimLimits);
export const selectClaimLimitSchema = createSelectSchema(claimLimits);

// Types
export type Asset = z.infer<typeof selectAssetSchema>;
export type NewAsset = z.infer<typeof insertAssetSchema>;
export type ClaimLimit = z.infer<typeof selectClaimLimitSchema>;
export type NewClaimLimit = z.infer<typeof insertClaimLimitSchema>;
