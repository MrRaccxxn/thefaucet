"use client";

import { Button } from "@/components/ui/button";
import type { AssetType } from "./asset-type-selector";

interface ClaimButtonProps {
  assetType: AssetType;
  walletAddress: string;
  isAuthenticated: boolean;
  authLoading: boolean;
  isClaimPending: boolean;
  currentLimit?: { remaining: number; timeRemaining?: string | null };
  selectedChainAmount: string;
  userNickname?: string;
  onClaim: () => void;
}

export function ClaimButton({
  assetType,
  walletAddress,
  isAuthenticated,
  authLoading,
  isClaimPending,
  currentLimit,
  selectedChainAmount,
  userNickname,
  onClaim,
}: ClaimButtonProps) {
  const getButtonText = () => {
    if (authLoading) return "Loading...";
    
    if (isClaimPending) {
      return assetType === "nft" ? "Minting..." : "Claiming...";
    }
    
    if (!walletAddress) return "Enter Wallet Address";
    
    if (!isAuthenticated) return "🔒 Authenticate with GitHub to Claim";
    
    if (isAuthenticated && currentLimit?.remaining === 0 && currentLimit?.timeRemaining) {
      return `Available in ${currentLimit.timeRemaining}`;
    }
    
    switch (assetType) {
      case "native":
        return `Claim ${selectedChainAmount}`;
      case "token":
        return "Claim 100 DEV Tokens";
      case "nft":
        return "Mint Developer NFT";
    }
  };

  const getHelpText = () => {
    switch (assetType) {
      case "native":
        return selectedChainAmount;
      case "token":
        return "100 DEV tokens";
      case "nft":
        return "developer NFT";
    }
  };

  return (
    <div className="pt-4">
      <Button
        size="lg"
        onClick={onClaim}
        className="w-full py-4 text-base font-medium bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={
          !walletAddress ||
          authLoading ||
          isClaimPending ||
          (isAuthenticated && currentLimit?.remaining === 0)
        }
      >
        {getButtonText()}
      </Button>

      {walletAddress && !isAuthenticated && !authLoading && (
        <p className="text-xs text-muted-foreground/60 mt-2 text-center">
          Click to authenticate with GitHub and claim {getHelpText()}
        </p>
      )}

      {isAuthenticated && userNickname && (
        <p className="text-xs text-muted-foreground/60 mt-2 text-center">
          Authenticated as @{userNickname}
        </p>
      )}
    </div>
  );
}