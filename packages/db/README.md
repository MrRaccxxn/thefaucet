# @thefaucet/db

Database schema and queries for the multichain faucet application using Drizzle ORM.

## Features

- **PostgreSQL Support**: Full PostgreSQL integration with connection pooling
- **Type Safety**: Complete TypeScript support with generated types
- **Migrations**: Automated migration system with Drizzle Kit
- **Query Helpers**: Pre-built query functions for common operations
- **Validation**: Zod schemas for input validation
- **Relations**: Proper foreign key relationships between tables

## Database Schema

### Tables

- **users**: GitHub OAuth user accounts
- **userWallets**: User wallet addresses
- **chains**: Supported blockchain networks
- **assets**: Tokens and NFTs available for claiming
- **claimLimits**: Rate limiting configuration per asset
- **claims**: Faucet claim records
- **redeemCodes**: Event/hackathon redeem codes
- **codeRedemptions**: Code usage tracking
- **rateLimits**: User rate limiting data

### Relationships

- Users can have multiple wallets (one-to-many)
- Claims reference users and assets (many-to-one)
- Assets belong to chains (many-to-one)
- Claim limits are configured per asset (one-to-one)
- Redeem codes can be used by multiple users (many-to-many via redemptions)

## Setup

### Prerequisites

- PostgreSQL database (local or cloud)
- Node.js 18+ and pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/thefaucet
NODE_ENV=development
```

### Database Migration

```bash
# Generate migration files
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (optional)
pnpm db:studio
```

## Usage

### Basic Database Operations

```typescript
import { db, userQueries, assetQueries, claimQueries } from '@thefaucet/db';

// Create a new user
const user = await userQueries.create({
  githubId: '12345',
  email: 'user@example.com',
  name: 'John Doe',
});

// Find assets by chain
const assets = await assetQueries.findByChainId(11155111); // Sepolia

// Create a claim
const claim = await claimQueries.create({
  userId: user.id,
  assetId: asset.id,
  walletAddress: '0x...',
  amount: '0.02',
  status: 'pending',
});
```

### Transaction Support

```typescript
import { db } from '@thefaucet/db';

await db.transaction(async (tx) => {
  // Multiple operations in a single transaction
  const user = await tx.insert(users).values(userData).returning();
  const wallet = await tx.insert(userWallets).values(walletData).returning();
  
  // Transaction will be rolled back if any operation fails
});
```

### Query Examples

```typescript
// Find user by GitHub ID
const user = await userQueries.findByGitHubId('12345');

// Get user's claim history
const claims = await claimQueries.findByUserId(user.id, 10, 0);

// Find active redeem codes
const codes = await redeemCodeQueries.findActive();

// Check rate limits
const rateLimit = await rateLimitQueries.findByUserAndAsset(
  user.id, 
  'native', 
  11155111
);
```

## Development

### Adding New Tables

1. Create schema file in `src/schema/`
2. Define table structure with proper indexes
3. Add Zod schemas for validation
4. Export from `src/schema/index.ts`
5. Generate and run migrations

### Adding Query Helpers

1. Create query file in `src/queries/`
2. Implement CRUD operations
3. Add pagination and filtering support
4. Export from `src/queries/index.ts`

### Testing

```bash
# Run tests
pnpm test

# Type checking
pnpm check-types

# Linting
pnpm lint
```

## Migration Commands

- `pnpm db:generate` - Generate migration files
- `pnpm db:migrate` - Run migrations
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:push` - Push schema changes directly (development only)

## Performance

- All tables include proper indexes for common queries
- Connection pooling configured for optimal performance
- Query helpers include pagination for large datasets
- Transactions used for multi-table operations

## Security

- Input validation with Zod schemas
- SQL injection protection via Drizzle ORM
- Proper foreign key constraints
- Cascade deletes configured appropriately
