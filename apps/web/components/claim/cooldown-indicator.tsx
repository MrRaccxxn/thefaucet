"use client";

import type { AssetType } from "./asset-type-selector";

interface CooldownIndicatorProps {
  assetType: AssetType;
  timeRemaining: string;
}

export function CooldownIndicator({
  assetType,
  timeRemaining,
}: CooldownIndicatorProps) {
  const getMessage = () => {
    switch (assetType) {
      case "native":
        return `Native tokens available in ${timeRemaining}`;
      case "token":
        return `DEV tokens available in ${timeRemaining}`;
      case "nft":
        return `NFT minting available in ${timeRemaining}`;
    }
  };

  return (
    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-amber-600 dark:text-amber-400">
          {getMessage()}
        </span>
      </div>
    </div>
  );
}