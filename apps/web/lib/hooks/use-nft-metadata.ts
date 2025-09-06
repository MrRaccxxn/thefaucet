"use client";

import { useState, useEffect } from "react";

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  dna?: string;
  edition?: number;
  date?: number;
  compiler?: string;
}

// Default NFT images for testnets
const DEFAULT_NFT_IMAGES: Record<string, string> = {
  ethereum:
    "https://raw.githubusercontent.com/ethereum/ethereum-org-website/dev/public/images/eth-diamond-purple.png",
  polygon:
    "https://raw.githubusercontent.com/maticnetwork/polygon-token-assets/main/assets/tokenAssets/matic.svg",
  bsc: "https://raw.githubusercontent.com/binance-chain/docs-site/master/docs/img/binance-chain.png",
  lisk: "https://raw.githubusercontent.com/LiskHQ/lisk-docs/main/static/img/logo.svg",
  default: "https://via.placeholder.com/500x500/6366F1/FFFFFF?text=NFT",
};

const CHAIN_NAMES: Record<number, string> = {
  11155111: "sepolia",
  4202: "lisk-sepolia",
  80002: "amoy",
  97: "bsc-testnet",
};

// Convert IPFS URL to HTTP URL
function convertIpfsToHttp(ipfsUrl: string): string {
  if (ipfsUrl.startsWith("ipfs://")) {
    return ipfsUrl.replace(
      "ipfs://",
      "https://jade-radical-tick-245.mypinata.cloud/ipfs/"
    );
  }
  return ipfsUrl;
}

// Hook to fetch the next available NFT metadata
// For now, we'll use a simplified version that generates a preview
// In the future, this can be enhanced to fetch from blockchain
export function useNextNFTMetadata(chainId: number, rpcUrl?: string) {
  const [nextNFTMetadata, setNextNFTMetadata] = useState<NFTMetadata | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chainId) {
      return;
    }

    let isMounted = true;

    async function fetchNextNFTMetadata() {
      setLoading(true);
      setError(null);

      try {
        // Get network name
        const networkName = CHAIN_NAMES[chainId] || "testnet";

        // For demo purposes, we'll simulate fetching the next NFT by creating a preview
        // This would be replaced with actual blockchain calls in production
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

        // Try to fetch a sample NFT metadata (you provided this URL structure)
        // For the example: https://jade-radical-tick-245.mypinata.cloud/ipfs/QmShYUhLFWLcSoqpaa18evzqLTWtzfkLVQzbZRbbKGDAzV/1
        const sampleMetadataUrl =
          "https://jade-radical-tick-245.mypinata.cloud/ipfs/QmShYUhLFWLcSoqpaa18evzqLTWtzfkLVQzbZRbbKGDAzV/1";

        try {
          const response = await fetch(sampleMetadataUrl);
          if (response.ok) {
            const metadata: NFTMetadata = await response.json();

            // Convert IPFS image URL to HTTP if needed
            if (metadata.image) {
              metadata.image = convertIpfsToHttp(metadata.image);
            }

            if (isMounted) {
              setNextNFTMetadata(metadata);
              return;
            }
          }
        } catch (fetchError) {
          console.log("Could not fetch sample metadata, using fallback");
        }

        // Fallback to a generated NFT metadata
        const fallbackMetadata: NFTMetadata = {
          name: `Lab Punks #${Math.floor(Math.random() * 1000) + 1}`,
          description: "Collection of fake punks only for study purposes",
          image:
            DEFAULT_NFT_IMAGES.default ||
            "https://via.placeholder.com/500x500/6366F1/FFFFFF?text=NFT",
          compiler: "HashLips Art Engine",
        };

        if (isMounted) {
          setNextNFTMetadata(fallbackMetadata);
        }
      } catch (err) {
        console.error("Failed to fetch next NFT metadata:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch NFT metadata"
          );
          setNextNFTMetadata(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchNextNFTMetadata();

    return () => {
      isMounted = false;
    };
  }, [chainId, rpcUrl]);

  return {
    nextNFTMetadata,
    loading,
    error,
  };
}
