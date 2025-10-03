# @thefaucet/contract-artifacts

Lightweight package containing contract ABIs, deployment addresses, types, and chain definitions for runtime use in frontend and backend applications.

## Contents

- **ABIs**: Contract application binary interfaces for interacting with deployed contracts
- **Deployments**: Contract addresses for different networks
- **Types**: TypeScript types for contract interactions
- **Chains**: Chain definitions for supported networks

## Usage

### Basic Usage

```typescript
import { ABIS, getDeploymentAddresses } from '@thefaucet/contract-artifacts';
import { liskSepolia } from '@thefaucet/contract-artifacts/chains';

// Get contract addresses for a network
const deployment = getDeploymentAddresses('lisk-sepolia');

// Use ABIs for contract interactions
const faucetManagerAbi = ABIS.FaucetManager;
```

### Wagmi Integration (Recommended)

The ABIs are exported with proper `as const` assertions for full TypeScript type inference in Wagmi:

```typescript
import { useReadContract, useWriteContract } from 'wagmi';
import { ABIS, FaucetManagerABI } from '@thefaucet/contract-artifacts';

// Option 1: Use the ABIS object
function useCanClaimNative(userAddress?: Address) {
  return useReadContract({
    address: contractAddress,
    abi: ABIS.FaucetManager, // ✅ Full type inference
    functionName: 'canClaimNative', // ✅ Autocomplete works!
    args: [userAddress],
  });
}

// Option 2: Use individual exports for better tree-shaking
function useClaimNative() {
  return useWriteContract({
    address: contractAddress,
    abi: FaucetManagerABI, // ✅ Full type inference
    functionName: 'claimNativeToken', // ✅ Autocomplete works!
    args: [recipientAddress],
  });
}
```

**Benefits:**
- ✅ Full TypeScript autocomplete for function names
- ✅ Type-safe function arguments
- ✅ Type-safe return values
- ✅ Catch errors at compile time

## Why This Package?

This package separates runtime contract artifacts from the heavy `@thefaucet/contracts` package which contains Foundry/Solidity build tools. This ensures:

- Faster builds in frontend applications
- Smaller bundle sizes
- Reliable Vercel deployments
- Clear separation between development and runtime dependencies

## Syncing ABIs from Contracts

After rebuilding contracts with Foundry, sync the ABIs:

```bash
# From the contract-artifacts directory
pnpm sync-abis

# Then rebuild
pnpm build
```

Or manually:
```bash
cd packages/contracts && forge build
cd ../contract-artifacts && pnpm sync-abis && pnpm build
```

**What happens during sync:**
1. Extracts compiled ABIs from `packages/contracts/out/`
2. Converts them to TypeScript files with `as const` assertions
3. Ensures proper type inference for Wagmi and other tools

## Technical Details

### Const Assertions

ABIs are exported as TypeScript constants with `as const` assertions, not JSON files. This allows TypeScript to:

1. **Narrow types**: Instead of generic `any[]`, TypeScript knows the exact shape
2. **Infer function names**: Autocomplete shows actual function names
3. **Type arguments**: Function parameters are type-checked
4. **Type returns**: Return values have proper types

Example type inference:
```typescript
import { FaucetManagerABI } from '@thefaucet/contract-artifacts';

// TypeScript infers the exact type:
type ABI = typeof FaucetManagerABI;
// ABI is readonly with exact function shapes, not generic any[]

// Function names are literal types:
type FunctionNames = ABI[number]['name'];
// 'canClaimNative' | 'claimNativeToken' | ... (not just 'string')
```

