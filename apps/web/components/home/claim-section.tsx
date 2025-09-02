"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useNetworkStore,
  useFormStore,
  useAuthStore,
  useFaucetActions,
} from "@/lib/stores";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SuccessAlert } from "@/components/ui/success-alert";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";
import React from "react";
import { api } from "@/lib/trpc/client";
import { getNumericChainId } from "@/lib/stores/constants";
import { NetworkDropdown } from "@/components/ui/network-dropdown";

function ClaimSectionContent() {
  const chains = useNetworkStore((state) => state.chains);
  const selectedChain = useNetworkStore((state) => state.selectedChain);
  const {
    walletAddress,
    redeemCode,
    showRedeemCode,
    setWalletAddress,
    setRedeemCode,
    setShowRedeemCode,
  } = useFormStore();

  // Asset type selection state
  const [assetType, setAssetType] = useState<"native" | "token" | "nft">(
    "native"
  );

  // Use the auth hook which syncs with NextAuth
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const {
    handleNetworkChange,
    handleClaimTokens: handleClaimNative,
    isClaimPending: isNativeClaimPending,
    claimError: nativeClaimError,
    isClaimSuccess: isNativeClaimSuccess,
  } = useFaucetActions();

  // Additional TRPC mutations for tokens and NFTs
  const claimTokenMutation = api.claim.claimERC20.useMutation();
  const mintNFTMutation = api.claim.mintNFT.useMutation();

  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addToast } = useToast();

  // Determine which mutation is active
  const isClaimPending =
    isNativeClaimPending ||
    claimTokenMutation.isPending ||
    mintNFTMutation.isPending;
  const claimError =
    nativeClaimError || claimTokenMutation.error || mintNFTMutation.error;
  const isClaimSuccess =
    isNativeClaimSuccess ||
    claimTokenMutation.isSuccess ||
    mintNFTMutation.isSuccess;

  // Show error when claim fails
  React.useEffect(() => {
    if (claimError) {
      setShowError(true);

      // Also show a toast notification
      const errorMessage = claimError.message;
      let friendlyMessage = errorMessage;

      // Extract user-friendly message from TRPC errors
      if (errorMessage.includes("FaucetService error:")) {
        const match = errorMessage.match(/FaucetService error: (.+?)(?:\n|$)/);
        if (match) {
          friendlyMessage = match[1];
        }
      }

      addToast({
        type: "error",
        title: "Claim Failed",
        message: friendlyMessage,
        duration: 8000, // Show longer for errors
      });
    }
  }, [claimError, addToast]);

  // Show success when claim succeeds
  React.useEffect(() => {
    if (isClaimSuccess) {
      setShowSuccess(true);

      // Show success toast
      const message =
        assetType === "native"
          ? `${selectedChain.amount} claimed successfully!`
          : assetType === "token"
            ? "100 DEV tokens claimed successfully!"
            : "Developer NFT minted successfully!";

      addToast({
        type: "success",
        title: "Success!",
        message,
      });

      // Auto-hide alert after 5 seconds
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isClaimSuccess, addToast, selectedChain.amount, assetType]);

  // Unified claim handler
  const handleClaimTokens = async () => {
    if (!walletAddress) return;

    if (!isAuthenticated) {
      const { openAuthModal } = useAuthStore.getState();
      openAuthModal();
      return;
    }

    const numericChainId = getNumericChainId(selectedChain.id);
    if (!numericChainId) {
      console.error(`Unsupported chain: ${selectedChain.id}`);
      return;
    }

    try {
      if (assetType === "native") {
        await handleClaimNative();
      } else if (assetType === "token") {
        // For now, we'll use a placeholder token ID - you'll need to get this from your assets
        await claimTokenMutation.mutateAsync({
          chainId: numericChainId,
          tokenId: "dev-token", // This should be fetched from your assets
          walletAddress,
        });
      } else if (assetType === "nft") {
        await mintNFTMutation.mutateAsync({
          chainId: numericChainId,
          collectionId: "dev-nft", // This should be fetched from your assets
          walletAddress,
          metadata: {
            name: "Developer NFT",
            description: "Limited edition testnet developer NFT",
            image: "https://via.placeholder.com/512", // Placeholder image
          },
        });
      }
    } catch (error) {
      console.error("Claim failed:", error);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in-up-delayed-2">
      {/* Error Alert */}
      {showError && claimError && (
        <ErrorAlert
          error={claimError as Error}
          onDismiss={() => setShowError(false)}
        />
      )}

      {/* Success Alert */}
      {showSuccess && (
        <SuccessAlert
          message="Tokens claimed successfully!"
          onDismiss={() => setShowSuccess(false)}
        />
      )}
      {/* Unified Network and Asset Selector - 20% bigger */}
      <div className="p-5 rounded-xl bg-card/20 backdrop-blur-md border border-border/20 hover:border-border/40 transition-all duration-300">
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-2">
            {/* Asset Type Selector */}
            <div className="flex gap-1 bg-background/30 p-1 rounded-lg">
              <button
                onClick={() => setAssetType("native")}
                className={`px-3 py-1.5 rounded text-sm transition-all duration-200 ${
                  assetType === "native"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Native
              </button>
              <button
                onClick={() => setAssetType("token")}
                className={`px-3 py-1.5 rounded text-sm transition-all duration-200 ${
                  assetType === "token"
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Token
              </button>
              <button
                onClick={() => setAssetType("nft")}
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
              {assetType === "native"
                ? selectedChain.amount
                : assetType === "token"
                  ? "100 DEV"
                  : "1 NFT"}
            </span>
          </div>
        </div>

        {/* Network selection dropdown - scalable for many networks */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Network</span>
          <NetworkDropdown
            chains={chains}
            selectedChain={selectedChain}
            onSelect={handleNetworkChange}
            className="flex-1"
          />
        </div>

        {/* NFT preview - shown only when NFT is selected */}
        {assetType === "nft" && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/10 animate-fade-in">
            <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center">
              <span className="text-5xl">🎨</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Developer NFT
              </p>
              <p className="text-xs text-muted-foreground">
                Limited edition testnet NFT
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Prominent Wallet Input - 20% bigger */}
      <div className="p-7 rounded-xl bg-card/20 backdrop-blur-md border border-border/20 hover:border-border/40 transition-all duration-300">
        <label className="block text-sm font-medium text-foreground mb-4">
          Wallet Address
        </label>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="0x..."
          className="w-full px-6 py-5 bg-background/60 border border-border/30 rounded-xl text-lg placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:bg-background/80 transition-all duration-200"
        />
      </div>

      {/* Redeem Code Section */}
      <div className="space-y-3">
        <button
          onClick={() => setShowRedeemCode(!showRedeemCode)}
          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center mx-auto"
        >
          <span className="mr-1">✨</span>
          Have a redeem code?
          <span className="ml-1">{showRedeemCode ? "−" : "+"}</span>
        </button>

        {showRedeemCode && (
          <div className="p-4 rounded-xl bg-card/20 backdrop-blur-md border border-border/20 hover:border-border/40 transition-all duration-300 animate-fade-in">
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Redeem Code (Optional)
            </label>
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder="Enter code for boosted rewards"
              className="w-full px-4 py-3 bg-background/50 border border-border/30 rounded-lg text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Single Claim Button with Auth Integration */}
      <div className="pt-4">
        <Button
          size="lg"
          onClick={handleClaimTokens}
          className="w-full py-4 text-base font-medium bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!walletAddress || authLoading || isClaimPending}
        >
          {authLoading
            ? "Loading..."
            : isClaimPending
              ? assetType === "nft"
                ? "Minting..."
                : "Claiming..."
              : !walletAddress
                ? "Enter Wallet Address"
                : !isAuthenticated
                  ? "🔒 Authenticate with GitHub to Claim"
                  : assetType === "native"
                    ? `Claim ${selectedChain.amount}`
                    : assetType === "token"
                      ? "Claim 100 DEV Tokens"
                      : "Mint Developer NFT"}
        </Button>

        {walletAddress && !isAuthenticated && !authLoading && (
          <p className="text-xs text-muted-foreground/60 mt-2 text-center">
            Click to authenticate with GitHub and claim{" "}
            {assetType === "native"
              ? selectedChain.amount
              : assetType === "token"
                ? "100 DEV tokens"
                : "developer NFT"}
          </p>
        )}

        {isAuthenticated && user && (
          <p className="text-xs text-muted-foreground/60 mt-2 text-center">
            Authenticated as @{user.nickname}
          </p>
        )}
      </div>
    </div>
  );
}

export function ClaimSection() {
  return (
    <ErrorBoundary>
      <ClaimSectionContent />
    </ErrorBoundary>
  );
}
