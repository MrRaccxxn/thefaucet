#!/bin/bash

# Deployment script for multiple networks
# Usage: ./scripts/deploy.sh <network>
# Example: ./scripts/deploy.sh lisk-sepolia

set -e

# Load .env file if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

NETWORK=$1

if [ -z "$NETWORK" ]; then
    echo "Usage: $0 <network>"
    echo "Available networks: sepolia, lisk-sepolia, amoy, bsc-testnet"
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

# Run deployment
forge script script/Deploy.s.sol \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    -v

echo "Deployment to $NETWORK completed!"