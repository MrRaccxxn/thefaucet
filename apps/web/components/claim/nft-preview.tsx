"use client";

import { useNextNFTMetadata } from "@/lib/hooks/use-nft-metadata";

interface NFTPreviewProps {
  chainId: number;
  rpcUrl?: string;
}

export function NFTPreview({ chainId, rpcUrl }: NFTPreviewProps) {
  const { nextNFTMetadata, loading: nftLoading } = useNextNFTMetadata(
    chainId,
    rpcUrl
  );

  const nftPreview = nextNFTMetadata || {
    name: "Developer NFT",
    description: "A unique developer NFT",
    image: "/default-nft.png",
  };

  return (
    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/10 animate-fade-in">
      <div className="w-32 h-32 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-blue-600/10 relative">
        {nftLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <img
            src={nftPreview.image}
            alt={nftPreview.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/500x500/6366F1/FFFFFF?text=NFT";
            }}
          />
        )}
        {nextNFTMetadata && (
          <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full">
            Next
          </div>
        )}
      </div>
      <div className="flex-1">
        {nftLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted/30 rounded animate-pulse"></div>
            <div className="h-3 bg-muted/20 rounded animate-pulse w-3/4"></div>
            <div className="h-3 bg-muted/20 rounded animate-pulse w-1/2"></div>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">
              {nftPreview.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {nftPreview.description}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {nextNFTMetadata ? "Next Available NFT" : "Testnet Collection"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}