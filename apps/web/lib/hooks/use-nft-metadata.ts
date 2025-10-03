"use client";

import { useState, useEffect } from "react";
import { NFT_CONFIG } from "@/lib/config/nft";

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

// Convert IPFS URL to HTTP URL
function convertIpfsToHttp(ipfsUrl: string): string {
  if (ipfsUrl.startsWith("ipfs://")) {
    return ipfsUrl.replace("ipfs://", NFT_CONFIG.IPFS_GATEWAY);
  }
  return ipfsUrl;
}

// Hook to fetch a random NFT metadata for preview
export function useRandomNFTMetadata(chainId: number, rpcUrl?: string) {
  const [nftMetadata, setNftMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<number | null>(null);

  useEffect(() => {
    if (!chainId) {
      return;
    }

    let isMounted = true;

    async function fetchRandomNFTMetadata() {
      setLoading(true);
      setError(null);

      try {
        const baseUrl = NFT_CONFIG.IPFS_BASE_URL;

        // Generate a random ID (skipping first 10)
        const randomId =
          Math.floor(
            Math.random() * (NFT_CONFIG.MAX_NFT_ID - NFT_CONFIG.MIN_NFT_ID + 1)
          ) + NFT_CONFIG.MIN_NFT_ID;

        try {
          const metadataUrl = `${baseUrl}${randomId}`;

          const response = await fetch(metadataUrl);
          if (response.ok) {
            const metadata: NFTMetadata = await response.json();

            // Convert IPFS image URL to HTTP if needed
            if (metadata.image) {
              metadata.image = convertIpfsToHttp(metadata.image);
            }

            // Update the name if needed
            metadata.name = metadata.name || `Lab Punks #${randomId}`;

            if (isMounted) {
              setNftMetadata(metadata);
              setTokenId(randomId);
              return;
            }
          }
        } catch (fetchError) {
          console.log(`NFT #${randomId} metadata not found, using fallback...`);
        }

        // Fallback metadata if fetch fails
        const fallbackMetadata: NFTMetadata = {
          name: `Lab Punks #${randomId}`,
          description: "Collection of fake punks only for study purposes",
          image: NFT_CONFIG.DEFAULT_NFT_IMAGE,
          attributes: [
            { trait_type: "Face", value: "face1" },
            { trait_type: "Ears", value: "ears3" },
            { trait_type: "Hair", value: "hair5" },
            { trait_type: "Beard", value: "beard6" },
            { trait_type: "Eyes", value: "eyes4" },
            { trait_type: "Nose", value: "n1" },
            { trait_type: "Mouth", value: "m4" },
            { trait_type: "Access", value: "acc1" },
          ],
          compiler: "HashLips Art Engine",
        };

        if (isMounted) {
          setNftMetadata(fallbackMetadata);
          setTokenId(randomId);
        }
      } catch (err) {
        console.error("Failed to fetch NFT metadata:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch NFT metadata"
          );
          setNftMetadata(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRandomNFTMetadata();

    return () => {
      isMounted = false;
    };
  }, [chainId, rpcUrl]);

  return {
    nftMetadata,
    loading,
    error,
    tokenId,
  };
}
