"use client";

export type AssetType = "native" | "token" | "nft";

interface AssetTypeSelectorProps {
  assetType: AssetType;
  onAssetTypeChange: (type: AssetType) => void;
  selectedChainAmount: string;
}

export function AssetTypeSelector({
  assetType,
  onAssetTypeChange,
  selectedChainAmount,
}: AssetTypeSelectorProps) {
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
          onClick={() => onAssetTypeChange("token")}
          className={`px-3 py-1.5 rounded text-sm transition-all duration-200 ${
            assetType === "token"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Token
        </button>
        <button
          onClick={() => onAssetTypeChange("nft")}
          className={`px-3 py-1.5 rounded text-sm transition-all duration-200 ${
            assetType === "nft"
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          NFT
        </button>
      </div>
      <span className="text-sm font-medium text-primary">
        {getAssetAmount()}
      </span>
    </div>
  );
}