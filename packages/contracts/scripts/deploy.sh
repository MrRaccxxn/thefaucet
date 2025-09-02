#!/bin/bash

# Deployment script for multiple networks
# Usage: ./scripts/deploy.sh <network> [--broadcast]
# Example: ./scripts/deploy.sh lisk-sepolia
# Example: ./scripts/deploy.sh lisk-sepolia --broadcast

set -e

# Load .env file if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

NETWORK=$1
BROADCAST_FLAG=$2

if [ -z "$NETWORK" ]; then
    echo "Usage: $0 <network> [--broadcast]"
    echo "Available networks: sepolia, lisk-sepolia, amoy, bsc-testnet"
    echo ""
    echo "Options:"
    echo "  --broadcast    Actually send transactions to the network (default: dry-run)"
    exit 1
fi

# Check required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY environment variable is required"
    exit 1
fi

if [ -z "$ALCHEMY_API_KEY" ]; then
    echo "Error: ALCHEMY_API_KEY environment variable is required"
    exit 1
fi

# Construct RPC URL based on network
case $NETWORK in
    "sepolia")
        RPC_URL="https://eth-sepolia.g.alchemy.com/v2/$ALCHEMY_API_KEY"
        ;;
    "lisk-sepolia")
        RPC_URL="https://rpc.sepolia-api.lisk.com"
        ;;
    "amoy")
        RPC_URL="https://polygon-amoy.g.alchemy.com/v2/$ALCHEMY_API_KEY"
        ;;
    "bsc-testnet")
        RPC_URL="https://bsc-testnet.g.alchemy.com/v2/$ALCHEMY_API_KEY"
        ;;
    *)
        echo "Error: Unsupported network '$NETWORK'"
        echo "Available networks: sepolia, lisk-sepolia, amoy, bsc-testnet"
        exit 1
        ;;
esac

echo "Deploying to $NETWORK..."
echo "RPC URL: $RPC_URL"

# Set NETWORK environment variable for the deployment script
export NETWORK=$NETWORK

# Build forge command
FORGE_CMD="forge script script/Deploy.s.sol --rpc-url $RPC_URL"

# Add verify flag with appropriate verifier for all networks
case $NETWORK in
    "sepolia"|"amoy"|"bsc-testnet")
        VERIFY_CMD="--verify"
        ;;
    "lisk-sepolia")
        # Blockscout verification for Lisk Sepolia
        VERIFY_CMD="--verify --verifier blockscout --verifier-url https://sepolia-blockscout.lisk.com/api"
        ;;
esac

# Add broadcast flag if specified
if [ "$BROADCAST_FLAG" == "--broadcast" ]; then
    echo "Mode: BROADCAST (sending real transactions)"
    FORGE_CMD="$FORGE_CMD --broadcast $VERIFY_CMD"
else
    echo "Mode: DRY-RUN (simulation only)"
    echo "To actually deploy, run: pnpm run deploy $NETWORK --broadcast"
    # Add verification flags even in dry-run to test verification setup
    FORGE_CMD="$FORGE_CMD $VERIFY_CMD"
fi

# Add verbosity
FORGE_CMD="$FORGE_CMD -v"

# Run deployment
eval $FORGE_CMD

if [ "$BROADCAST_FLAG" == "--broadcast" ]; then
    echo "Deployment to $NETWORK completed!"
else
    echo "Dry-run simulation completed. No transactions were sent."
fi