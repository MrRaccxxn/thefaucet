import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '../connection';
import { users, userWallets, rateLimits, type User, type NewUser, type UserWallet, type NewUserWallet, type RateLimit, type NewRateLimit } from '../schema';

// User operations
export const userQueries = {
  // Create a new user
  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    if (!user) throw new Error('Failed to create user');
    return user;
  },

  // Find user by ID
  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  },

  // Find user by GitHub ID
  async findByGitHubId(githubId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.githubId, githubId));
    return user || null;
  },

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  },

  // Update user
  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || null;
  },

  // Delete user
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.length > 0;
  },

  // List users with pagination
  async list(limit = 10, offset = 0): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
  },
};

// User wallet operations
export const walletQueries = {
  // Create a new wallet
  async create(data: NewUserWallet): Promise<UserWallet> {
    const [wallet] = await db.insert(userWallets).values(data).returning();
    if (!wallet) throw new Error('Failed to create wallet');
    return wallet;
  },

  // Find wallet by ID
  async findById(id: string): Promise<UserWallet | null> {
    const [wallet] = await db.select().from(userWallets).where(eq(userWallets.id, id));
    return wallet || null;
  },

  // Find wallets by user ID
  async findByUserId(userId: string): Promise<UserWallet[]> {
    return db.select().from(userWallets).where(eq(userWallets.userId, userId));
  },

  // Find primary wallet by user ID
  async findPrimaryByUserId(userId: string): Promise<UserWallet | null> {
    const [wallet] = await db
      .select()
      .from(userWallets)
      .where(and(eq(userWallets.userId, userId), eq(userWallets.isPrimary, true)));
    return wallet || null;
  },

  // Set wallet as primary
  async setPrimary(userId: string, walletId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Remove primary flag from all user wallets
      await tx.update(userWallets).set({ isPrimary: false }).where(eq(userWallets.userId, userId));
      // Set the specified wallet as primary
      await tx.update(userWallets).set({ isPrimary: true }).where(eq(userWallets.id, walletId));
    });
  },

  // Delete wallet
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(userWallets).where(eq(userWallets.id, id));
    return result.length > 0;
  },
};

// Rate limit operations
export const rateLimitQueries = {
  // Create or update rate limit
  async upsert(data: NewRateLimit): Promise<RateLimit> {
    const [rateLimit] = await db
      .insert(rateLimits)
      .values(data)
      .onConflictDoUpdate({
        target: [rateLimits.userId, rateLimits.assetType, rateLimits.chainId],
        set: {
          lastClaimAt: data.lastClaimAt,
          claimCount: data.claimCount,
          resetAt: data.resetAt,
        },
      })
      .returning();
    if (!rateLimit) throw new Error('Failed to upsert rate limit');
    return rateLimit;
  },

  // Find rate limit by user, asset type, and chain
  async findByUserAndAsset(userId: string, assetType: string, chainId: number): Promise<RateLimit | null> {
    const [rateLimit] = await db
      .select()
      .from(rateLimits)
      .where(and(eq(rateLimits.userId, userId), eq(rateLimits.assetType, assetType), eq(rateLimits.chainId, chainId)));
    return rateLimit || null;
  },

  // Get all rate limits for a user
  async findByUserId(userId: string): Promise<RateLimit[]> {
    return db.select().from(rateLimits).where(eq(rateLimits.userId, userId));
  },

  // Reset rate limit
  async reset(userId: string, assetType: string, chainId: number): Promise<void> {
    await db
      .update(rateLimits)
      .set({ claimCount: 0, resetAt: new Date() })
      .where(and(eq(rateLimits.userId, userId), eq(rateLimits.assetType, assetType), eq(rateLimits.chainId, chainId)));
  },
};
