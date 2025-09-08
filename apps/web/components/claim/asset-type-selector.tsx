"use client";

export type AssetType = "native" | "token" | "nft";

interface AssetTypeSelectorProps {
  assetType: AssetType;
  onAssetTypeChange: (type: AssetType) => void;
  selectedChainAmount: string;
  chainId?: number;
}

export function AssetTypeSelector({
  assetType,
  onAssetTypeChange,
  selectedChainAmount,
  chainId,
}: AssetTypeSelectorProps) {
  // Only Lisk Sepolia (4202) supports tokens and NFTs currently
  const isLiskSepolia = chainId === 4202;
  const supportsToken = isLiskSepolia;
  const supportsNFT = isLiskSepolia;
  const getAssetAmount = () => {
    switch (assetType) {
      case "native":
        return selectedChainAmount;
      case "token":
        return "100 DEV";
      case "nft":
        return "1 NFT";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 bg-background/30 p-1 rounded-lg">
        <button
          onClick={() => onAssetTypeChange("native")}
          className={`px-3 py-1.5 rounded text-sm transition-all duration-200 ${
            assetType === "native"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Native
        </button>
        <button
          onClick={() => supportsToken && onAssetTypeChange("token")}
          disabled={!supportsToken}
          className={`px-3 py-1.5 rounded text-sm transition-all duration-200 relative ${
            assetType === "token"
              ? "bg-primary/20 text-primary"
              : supportsToken
              ? "text-muted-foreground hover:text-foreground"
              : "text-muted-foreground/40 cursor-not-allowed"
          }`}
          title={!supportsToken ? "Tokens only available on Lisk Sepolia" : undefined}
        >
          Token
          {!supportsToken && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => supportsNFT && onAssetTypeChange("nft")}
          disabled={!supportsNFT}
          className={`px-3 py-1.5 rounded text-sm transition-all duration-200 relative ${
            assetType === "nft"
              ? "bg-primary/20 text-primary"
              : supportsNFT
              ? "text-muted-foreground hover:text-foreground"
              : "text-muted-foreground/40 cursor-not-allowed"
          }`}
          title={!supportsNFT ? "NFTs only available on Lisk Sepolia" : undefined}
        >
          NFT
          {!supportsNFT && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
          )}
        </button>
      </div>
      <span className="text-sm font-medium text-primary">
        {getAssetAmount()}
      </span>
    </div>
  );
}