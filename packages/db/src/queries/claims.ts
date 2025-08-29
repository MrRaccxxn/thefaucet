import { eq, and, desc, asc, gte, lte, like, or, isNull } from 'drizzle-orm';
import { db } from '../connection';
import { claims, redeemCodes, codeRedemptions, type Claim, type NewClaim, type RedeemCode, type NewRedeemCode, type CodeRedemption, type NewCodeRedemption } from '../schema';
import { sql } from 'drizzle-orm';

// Type assertion helper for JSON fields
type Json = any;

// Claim operations
export const claimQueries = {
  // Create a new claim
  async create(data: NewClaim): Promise<Claim> {
    const [claim] = await db.insert(claims).values(data).returning();
    if (!claim) throw new Error('Failed to create claim');
    return claim as Claim;
  },

  // Find claim by ID
  async findById(id: string): Promise<Claim | null> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    return (claim as Claim) || null;
  },

  // Find claims by user ID
  async findByUserId(userId: string, limit = 10, offset = 0): Promise<Claim[]> {
    const results = await db
      .select()
      .from(claims)
      .where(eq(claims.userId, userId))
      .orderBy(desc(claims.createdAt))
      .limit(limit)
      .offset(offset);
    return results as Claim[];
  },

  // Find claims by asset ID
  async findByAssetId(assetId: string, limit = 10, offset = 0): Promise<Claim[]> {
    const results = await db
      .select()
      .from(claims)
      .where(eq(claims.assetId, assetId))
      .orderBy(desc(claims.createdAt))
      .limit(limit)
      .offset(offset);
    return results as Claim[];
  },

  // Find claims by status
  async findByStatus(status: string, limit = 10, offset = 0): Promise<Claim[]> {
    const results = await db
      .select()
      .from(claims)
      .where(eq(claims.status, status))
      .orderBy(desc(claims.createdAt))
      .limit(limit)
      .offset(offset);
    return results as Claim[];
  },

  // Find claims by transaction hash
  async findByTxHash(txHash: string): Promise<Claim | null> {
    const [claim] = await db.select().from(claims).where(eq(claims.txHash, txHash));
    return (claim as Claim) || null;
  },

  // Find claims by date range
  async findByDateRange(startDate: Date, endDate: Date, limit = 10, offset = 0): Promise<Claim[]> {
    const results = await db
      .select()
      .from(claims)
      .where(and(gte(claims.createdAt, startDate), lte(claims.createdAt, endDate)))
      .orderBy(desc(claims.createdAt))
      .limit(limit)
      .offset(offset);
    return results as Claim[];
  },

  // Update claim status
  async updateStatus(id: string, status: string, txHash?: string): Promise<Claim | null> {
    const updateData: any = { status };
    if (txHash) updateData.txHash = txHash;
    if (status === 'confirmed') updateData.confirmedAt = new Date();

    const [claim] = await db
      .update(claims)
      .set(updateData)
      .where(eq(claims.id, id))
      .returning();
    return (claim as Claim) || null;
  },

  // Update claim
  async update(id: string, data: Partial<NewClaim>): Promise<Claim | null> {
    const [claim] = await db.update(claims).set(data).where(eq(claims.id, id)).returning();
    return (claim as Claim) || null;
  },

  // Delete claim
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(claims).where(eq(claims.id, id));
    return result.length > 0;
  },

  // List claims with pagination
  async list(limit = 10, offset = 0): Promise<Claim[]> {
    const results = await db.select().from(claims).orderBy(desc(claims.createdAt)).limit(limit).offset(offset);
    return results as Claim[];
  },

  // Get claim statistics
  async getStats(): Promise<{ total: number; pending: number; confirmed: number; failed: number }> {
    const [total] = await db.select({ count: sql`count(*)` }).from(claims);
    const [pending] = await db.select({ count: sql`count(*)` }).from(claims).where(eq(claims.status, 'pending'));
    const [confirmed] = await db.select({ count: sql`count(*)` }).from(claims).where(eq(claims.status, 'confirmed'));
    const [failed] = await db.select({ count: sql`count(*)` }).from(claims).where(eq(claims.status, 'failed'));

    return {
      total: Number(total?.count || 0),
      pending: Number(pending?.count || 0),
      confirmed: Number(confirmed?.count || 0),
      failed: Number(failed?.count || 0),
    };
  },
};

// Redeem code operations
export const redeemCodeQueries = {
  // Create a new redeem code
  async create(data: NewRedeemCode): Promise<RedeemCode> {
    const [code] = await db.insert(redeemCodes).values(data).returning();
    if (!code) throw new Error('Failed to create redeem code');
    return code as RedeemCode;
  },

  // Find redeem code by ID
  async findById(id: string): Promise<RedeemCode | null> {
    const [code] = await db.select().from(redeemCodes).where(eq(redeemCodes.id, id));
    return (code as RedeemCode) || null;
  },

  // Find redeem code by code string
  async findByCode(codeString: string): Promise<RedeemCode | null> {
    const [code] = await db.select().from(redeemCodes).where(eq(redeemCodes.code, codeString));
    return (code as RedeemCode) || null;
  },

  // Find active redeem codes
  async findActive(): Promise<RedeemCode[]> {
    const results = await db
      .select()
      .from(redeemCodes)
      .where(and(eq(redeemCodes.isActive, true), or(isNull(redeemCodes.expiresAt), gte(redeemCodes.expiresAt, new Date()))))
      .orderBy(desc(redeemCodes.createdAt));
    return results as RedeemCode[];
  },

  // Update redeem code
  async update(id: string, data: Partial<NewRedeemCode>): Promise<RedeemCode | null> {
    const [code] = await db
      .update(redeemCodes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(redeemCodes.id, id))
      .returning();
    return (code as RedeemCode) || null;
  },

  // Increment usage count
  async incrementUsage(id: string): Promise<RedeemCode | null> {
    const [code] = await db
      .update(redeemCodes)
      .set({ currentUses: sql`current_uses + 1`, updatedAt: new Date() })
      .where(eq(redeemCodes.id, id))
      .returning();
    return (code as RedeemCode) || null;
  },

  // Delete redeem code
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(redeemCodes).where(eq(redeemCodes.id, id));
    return result.length > 0;
  },

  // List redeem codes with pagination
  async list(limit = 10, offset = 0): Promise<RedeemCode[]> {
    const results = await db.select().from(redeemCodes).orderBy(desc(redeemCodes.createdAt)).limit(limit).offset(offset);
    return results as RedeemCode[];
  },
};

// Code redemption operations
export const codeRedemptionQueries = {
  // Create a new code redemption
  async create(data: NewCodeRedemption): Promise<CodeRedemption> {
    const [redemption] = await db.insert(codeRedemptions).values(data).returning();
    if (!redemption) throw new Error('Failed to create code redemption');
    return redemption as CodeRedemption;
  },

  // Find redemption by ID
  async findById(id: string): Promise<CodeRedemption | null> {
    const [redemption] = await db.select().from(codeRedemptions).where(eq(codeRedemptions.id, id));
    return (redemption as CodeRedemption) || null;
  },

  // Find redemptions by user ID
  async findByUserId(userId: string, limit = 10, offset = 0): Promise<CodeRedemption[]> {
    const results = await db
      .select()
      .from(codeRedemptions)
      .where(eq(codeRedemptions.userId, userId))
      .orderBy(desc(codeRedemptions.createdAt))
      .limit(limit)
      .offset(offset);
    return results as CodeRedemption[];
  },

  // Find redemptions by code ID
  async findByCodeId(codeId: string, limit = 10, offset = 0): Promise<CodeRedemption[]> {
    const results = await db
      .select()
      .from(codeRedemptions)
      .where(eq(codeRedemptions.codeId, codeId))
      .orderBy(desc(codeRedemptions.createdAt))
      .limit(limit)
      .offset(offset);
    return results as CodeRedemption[];
  },

  // Check if user has already used a code
  async hasUserUsedCode(userId: string, codeId: string): Promise<boolean> {
    const [redemption] = await db
      .select()
      .from(codeRedemptions)
      .where(and(eq(codeRedemptions.userId, userId), eq(codeRedemptions.codeId, codeId)));
    return !!redemption;
  },

  // List redemptions with pagination
  async list(limit = 10, offset = 0): Promise<CodeRedemption[]> {
    const results = await db.select().from(codeRedemptions).orderBy(desc(codeRedemptions.createdAt)).limit(limit).offset(offset);
    return results as CodeRedemption[];
  },
};
