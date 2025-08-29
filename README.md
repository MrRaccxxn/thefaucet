# The Faucet - Multichain Testnet Faucet

A modern, multichain faucet application for EVM-compatible testnets with GitHub OAuth authentication and redeem code functionality. Built with Next.js, tRPC, and Drizzle ORM in a Turborepo monorepo structure.

## Features

- 🌐 **Multichain Support**: Ethereum Sepolia, Polygon Amoy, BSC Testnet
- 🔐 **GitHub OAuth**: Secure authentication with account verification
- 💧 **Multiple Asset Types**: Native tokens, ERC20 tokens, and NFTs
- 🎫 **Redeem Codes**: Time-limited codes with boosted amounts for events
- ⚡ **Rate Limiting**: Redis-based rate limiting with cooldown periods
- 📊 **Analytics**: Comprehensive usage tracking and admin dashboard
- 🛡️ **Abuse Prevention**: Advanced protection against farming and abuse
- 🏗️ **Modern Stack**: Next.js 14, tRPC, Drizzle ORM, Tailwind CSS

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### Development Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd thefaucet
   pnpm install
   ```

2. **Start development services**:
   ```bash
   pnpm docker:up
   ```

3. **Set up environment variables**:
   ```bash
   cp infra/docker/env.example .env
   ```

4. **Run database migrations**:
   ```bash
   pnpm db:migrate
   ```

5. **Start the development server**:
   ```bash
   pnpm dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

### Apps and Packages

- `apps/web`: Main Next.js 14 application with App Router
- `packages/ui`: Shared React component library with shadcn/ui
- `packages/db`: Database schema and queries using Drizzle ORM
- `packages/core`: Business logic and chain adapters
- `packages/contracts`: Smart contracts using Foundry
- `packages/config`: Shared configurations (TypeScript, ESLint, Environment)
- `infra/docker`: Docker development environment

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## Docker Development Environment

The project includes a complete Docker setup for local development. See [infra/docker/README.md](infra/docker/README.md) for detailed documentation.

### Available Docker Commands

| Command | Description |
|---------|-------------|
| `pnpm docker:up` | Start all services (PostgreSQL, Redis, Anvil nodes) |
| `pnpm docker:down` | Stop all services |
| `pnpm docker:restart` | Restart all services |
| `pnpm docker:logs` | View logs from all services |
| `pnpm docker:status` | Check service status |
| `pnpm docker:clean` | Clean up volumes and containers |

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server for all packages |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run tests for all packages |
| `pnpm db:generate` | Generate Drizzle schema |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Drizzle Studio |

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
