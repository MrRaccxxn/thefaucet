#!/bin/bash
# Sync ABIs from the contracts package to contract-artifacts
# Run this after rebuilding contracts with Foundry

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Syncing ABIs from contracts to contract-artifacts..."

# Check if contracts are built
if [ ! -d "$SCRIPT_DIR/../../contracts/out" ]; then
    echo "❌ Error: Contracts not built. Run 'forge build' in packages/contracts first."
    exit 1
fi

# Generate TypeScript ABI files with const assertions
node "$SCRIPT_DIR/generate-abi-ts.js"

echo ""
echo "Next steps:"
echo "  1. cd packages/contract-artifacts && pnpm build"
echo "  2. Commit the updated ABIs"

