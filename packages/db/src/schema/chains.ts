import { pgTable, text, timestamp, integer, uuid, boolean, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Chains table - stores supported blockchain networks
export const chains = pgTable('chains', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  chainId: integer('chain_id').unique().notNull(),
  rpcUrl: text('rpc_url').notNull(),
  blockExplorerUrl: text('block_explorer_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  chainIdIdx: index('chains_chain_id_idx').on(table.chainId),
  isActiveIdx: index('chains_is_active_idx').on(table.isActive),
}));

// Zod schemas for validation
export const insertChainSchema = createInsertSchema(chains);
export const selectChainSchema = createSelectSchema(chains);

// Types
export type Chain = z.infer<typeof selectChainSchema>;
export type NewChain = z.infer<typeof insertChainSchema>;
