import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import { db } from '../connection';
import { chains, assets, claimLimits, type Chain, type NewChain, type Asset, type NewAsset, type ClaimLimit, type NewClaimLimit } from '../schema';

// Chain operations
export const chainQueries = {
  // Create a new chain
  async create(data: NewChain): Promise<Chain> {
    const [chain] = await db.insert(chains).values(data).returning();
    if (!chain) throw new Error('Failed to create chain');
    return chain;
  },

  // Find chain by ID
  async findById(id: string): Promise<Chain | null> {
    const [chain] = await db.select().from(chains).where(eq(chains.id, id));
    return chain || null;
  },

  // Find chain by chain ID
  async findByChainId(chainId: number): Promise<Chain | null> {
    const [chain] = await db.select().from(chains).where(eq(chains.chainId, chainId));
    return chain || null;
  },

  // Find all active chains
  async findActive(): Promise<Chain[]> {
    return db.select().from(chains).where(eq(chains.isActive, true)).orderBy(asc(chains.name));
  },

  // Update chain
  async update(id: string, data: Partial<NewChain>): Promise<Chain | null> {
    const [chain] = await db
      .update(chains)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chains.id, id))
      .returning();
    return chain || null;
  },

  // Delete chain
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(chains).where(eq(chains.id, id));
    return result.length > 0;
  },

  // List chains with pagination
  async list(limit = 10, offset = 0): Promise<Chain[]> {
    return db.select().from(chains).orderBy(asc(chains.name)).limit(limit).offset(offset);
  },
};

// Asset operations
export const assetQueries = {
  // Create a new asset
  async create(data: NewAsset): Promise<Asset> {
    const [asset] = await db.insert(assets).values(data).returning();
    if (!asset) throw new Error('Failed to create asset');
    return asset;
  },

  // Find asset by ID
  async findById(id: string): Promise<Asset | null> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset || null;
  },

  // Find assets by chain ID
  async findByChainId(chainId: number): Promise<Asset[]> {
    return db.select().from(assets).where(eq(assets.chainId, chainId)).orderBy(asc(assets.name));
  },

  // Find assets by type
  async findByType(type: string): Promise<Asset[]> {
    return db.select().from(assets).where(eq(assets.type, type)).orderBy(asc(assets.name));
  },

  // Find active assets by chain ID
  async findActiveByChainId(chainId: number): Promise<Asset[]> {
    return db
      .select()
      .from(assets)
      .where(and(eq(assets.chainId, chainId), eq(assets.isActive, true)))
      .orderBy(asc(assets.name));
  },

  // Find asset by address and chain
  async findByAddressAndChain(address: string, chainId: number): Promise<Asset | null> {
    const [asset] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.address, address), eq(assets.chainId, chainId)));
    return asset || null;
  },

  // Update asset
  async update(id: string, data: Partial<NewAsset>): Promise<Asset | null> {
    const [asset] = await db
      .update(assets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return asset || null;
  },

  // Delete asset
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.id, id));
    return result.length > 0;
  },

  // List assets with pagination
  async list(limit = 10, offset = 0): Promise<Asset[]> {
    return db.select().from(assets).orderBy(asc(assets.name)).limit(limit).offset(offset);
  },
};

// Claim limit operations
export const claimLimitQueries = {
  // Create a new claim limit
  async create(data: NewClaimLimit): Promise<ClaimLimit> {
    const [claimLimit] = await db.insert(claimLimits).values(data).returning();
    if (!claimLimit) throw new Error('Failed to create claim limit');
    return claimLimit;
  },

  // Find claim limit by ID
  async findById(id: string): Promise<ClaimLimit | null> {
    const [claimLimit] = await db.select().from(claimLimits).where(eq(claimLimits.id, id));
    return claimLimit || null;
  },

  // Find claim limit by asset ID
  async findByAssetId(assetId: string): Promise<ClaimLimit | null> {
    const [claimLimit] = await db.select().from(claimLimits).where(eq(claimLimits.assetId, assetId));
    return claimLimit || null;
  },

  // Update claim limit
  async update(id: string, data: Partial<NewClaimLimit>): Promise<ClaimLimit | null> {
    const [claimLimit] = await db
      .update(claimLimits)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(claimLimits.id, id))
      .returning();
    return claimLimit || null;
  },

  // Delete claim limit
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(claimLimits).where(eq(claimLimits.id, id));
    return result.length > 0;
  },

  // List claim limits with pagination
  async list(limit = 10, offset = 0): Promise<ClaimLimit[]> {
    return db.select().from(claimLimits).orderBy(desc(claimLimits.createdAt)).limit(limit).offset(offset);
  },
};
