# Docker Development Environment

This directory contains the Docker configuration for running the Faucet application in a local development environment. The setup includes PostgreSQL for data storage. The application connects directly to testnet RPC providers (Alchemy, Infura, etc.) for blockchain interactions.

## Services Overview

### PostgreSQL Database
- **Image**: `postgres:15-alpine`
- **Port**: `5432`
- **Database**: `faucet_db` (main), `faucet_test_db` (testing)
- **User**: `faucet_user`
- **Data Persistence**: `./volumes/postgres`
- **Schema Management**: Drizzle ORM (integrated in `packages/db`)

### Blockchain Connectivity
The application connects directly to testnet RPC providers:

1. **Ethereum Sepolia** 
   - Chain ID: `11155111`
   - RPC: Alchemy API

2. **Polygon Amoy**
   - Chain ID: `80002`
   - RPC: Alchemy API

3. **BSC Testnet**
   - Chain ID: `97`
   - RPC: Public endpoint

**Benefits of this approach:**
- ✅ Faster MVP development (no local blockchain management)
- ✅ Easy to add new chains (just add RPC URLs)
- ✅ Real testnet state and conditions
- ✅ No local resource usage for blockchain nodes

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- pnpm package manager
- Node.js 18+ (for the main application)
- **Alchemy API Key** (sign up at [alchemy.com](https://alchemy.com))

### Setup Steps

1. **Copy environment configuration**:
   ```bash
   cp infra/docker/env.example .env
   ```

2. **Add your Alchemy API key to .env**:
   ```bash
   ALCHEMY_API_KEY=your-actual-api-key-here
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-actual-api-key-here
   AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your-actual-api-key-here
   ```

3. **Start PostgreSQL service**:
   ```bash
   pnpm docker:up
   ```

4. **Verify PostgreSQL is running**:
   ```bash
   pnpm docker:status
   ```

5. **View logs** (optional):
   ```bash
   pnpm docker:logs
   ```

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm docker:up` | Start PostgreSQL service |
| `pnpm docker:down` | Stop PostgreSQL service |
| `pnpm docker:restart` | Restart PostgreSQL service |
| `pnpm docker:logs` | View PostgreSQL logs |
| `pnpm docker:status` | Check PostgreSQL status |
| `pnpm docker:clean` | Stop services and remove volumes/orphaned containers |

## Service Configuration

### Database Configuration
The PostgreSQL database is automatically configured with:
- Main database: `faucet_db`
- Test database: `faucet_test_db`
- Required PostgreSQL extensions (UUID, pgcrypto, etc.)
- Additional users for read-only access and backups

**Important**: The database schema is managed by Drizzle ORM in `packages/db`. All schema definitions, migrations, and queries are centralized there.

### Anvil Node Configuration
Each Anvil node is configured with:
- 10 pre-funded accounts
- 1000 ETH balance per account
- Forking from respective testnets
- Appropriate gas limits and block times

## Connection Details

### Database Connection
```
Host: localhost
Port: 5432
Database: faucet_db
Username: faucet_user
Password: faucet_password
URL: postgresql://faucet_user:faucet_password@localhost:5432/faucet_db
```

### Testnet RPC Endpoints
The application connects to these external RPC providers:
```
Ethereum Sepolia: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
Polygon Amoy: https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
BSC Testnet: https://bsc-testnet.public.blastapi.io
```

## Development Workflow

1. **Start services**: `pnpm docker:up`
2. **Install dependencies**: `pnpm install`
3. **Generate and run database migrations**: 
   ```bash
   pnpm --filter @thefaucet/db db:generate
   pnpm --filter @thefaucet/db db:migrate
   ```
4. **Start the application**: `pnpm dev`
5. **Stop services when done**: `pnpm docker:down`

## Troubleshooting

### Services won't start
- Check if ports are already in use: `lsof -i :5432,8545,8546,8547`
- Ensure Docker daemon is running
- Check Docker Compose logs: `pnpm docker:logs`

### Database connection issues
- Verify PostgreSQL is running: `pnpm docker:status`
- Check database logs: `docker logs thefaucet-postgres`
- Ensure environment variables are correct in your `.env` file

### Anvil node issues
- Check if RPC endpoints respond: `curl http://localhost:8545`
- Verify network connectivity to fork URLs
- Check Anvil logs: `docker logs thefaucet-anvil-sepolia`

### Drizzle/Migration issues
- Ensure you're in the correct package: `cd packages/db`
- Check environment variables are loaded: `DATABASE_URL` should be set
- Run migrations manually: `pnpm --filter @thefaucet/db db:migrate`

### Volume permissions
If you encounter permission issues with volumes:
```bash
sudo chown -R $USER:$USER infra/docker/volumes/
```

## Data Persistence

- **PostgreSQL data**: Stored in `./volumes/postgres`
- **Volumes are preserved** between container restarts
- Use `pnpm docker:clean` to remove all data (destructive operation)

## Environment Variables

See `env.example` for all available environment variables. Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `SEPOLIA_RPC_URL`: Ethereum Sepolia RPC endpoint  
- `AMOY_RPC_URL`: Polygon Amoy RPC endpoint
- `BSC_TESTNET_RPC_URL`: BSC Testnet RPC endpoint

## Integration with Application

The Docker services are designed to work seamlessly with:
- **Drizzle ORM**: For database schema management (in `packages/db`)
- **packages/core**: Core business logic and chain adapters
- **Rate limiting**: Database-based rate limiting (PostgreSQL)
- **Session storage**: Database-based sessions via NextAuth.js

## Production Considerations

This Docker setup is designed for **development only**. For production:
- Use managed database services (Neon, Supabase)
- Use actual testnet RPC endpoints (not local Anvil nodes)
- Implement proper security measures
- Use environment-specific configurations

## Health Checks

All services include health checks:
- **PostgreSQL**: `pg_isready` command
- **Anvil nodes**: HTTP endpoint checks

Health check status can be viewed with `pnpm docker:status`.

## Network Configuration

All services run on a custom Docker network (`faucet-network`) to ensure:
- Isolated communication between services
- Consistent service discovery
- No conflicts with other Docker projects
