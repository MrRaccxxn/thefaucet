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
import { getRandomNFTImage } from "@/lib/utils/nft-images";
import { ClientOnly } from "@/components/providers/client-only";
import { WalletAddressAutofill } from "./wallet-address-autofill";

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
  
  // Track if user has manually edited the address
  const [hasUserEditedAddress, setHasUserEditedAddress] = useState(false);
  
  // NFT preview image
  const [nftPreview] = useState(() => getRandomNFTImage());

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
  const claimTokenMutation = api.claim.claimDevToken.useMutation();
  const mintNFTMutation = api.claim.mintNFT.useMutation();

  // Get user limits for current chain
  const numericChainId = getNumericChainId(selectedChain.id);
  const { data: limits } = api.claim.getLimits.useQuery(
    { chainId: numericChainId || 11155111 },
    { 
      enabled: isAuthenticated && !!numericChainId,
      refetchInterval: 60000, // Refetch every minute to update countdown
    }
  );

  // Helper function to get remaining time for current asset type
  const getCurrentAssetLimit = () => {
    if (!limits) return null;
    const limitKey = assetType === "token" ? "erc20" : assetType;
    return limits[limitKey];
  };

  const currentLimit = getCurrentAssetLimit();

  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTransactionHash, setLastTransactionHash] = useState<string | null>(null);
  const { addToast } = useToast();

  // Determine which mutation is active
  const isClaimPending =
    isNativeClaimPending ||
    claimTokenMutation.isPending ||
    mintNFTMutation.isPending;
  const claimError =
    nativeClaimError || claimTokenMutation.error || mintNFTMutation.error;

  // Debug error states
  React.useEffect(() => {
    console.log('🟠 ClaimSection: Error states changed:', {
      nativeClaimError: nativeClaimError?.message,
      tokenError: claimTokenMutation.error?.message,
      nftError: mintNFTMutation.error?.message,
      combinedError: claimError?.message,
      showError,
    });
  }, [nativeClaimError, claimTokenMutation.error, mintNFTMutation.error, claimError, showError]);
  const isClaimSuccess =
    isNativeClaimSuccess ||
    claimTokenMutation.isSuccess ||
    mintNFTMutation.isSuccess;


  // Show error when claim fails
  React.useEffect(() => {
    if (claimError) {
      console.log('🔴 ClaimSection: Error detected:', claimError);
      console.log('🔴 ClaimSection: Error message:', claimError.message);
      console.log('🔴 ClaimSection: Error type:', typeof claimError);
      console.log('🔴 ClaimSection: Error constructor:', claimError.constructor.name);
      
      setShowError(true);

      const errorMessage = claimError.message;
      const isRateLimitError = errorMessage.includes("You must wait") || 
                              errorMessage.includes("You have already claimed") || 
                              errorMessage.includes("Rate limit") ||
                              errorMessage.includes("TOO_MANY_REQUESTS");

      console.log('🔴 ClaimSection: Is rate limit error?', isRateLimitError);

      // For rate limit errors, use the exact backend message (it already has perfect formatting)
      let friendlyMessage = errorMessage;

      // Only extract from "FaucetService error:" for non-rate-limit errors
      if (!isRateLimitError && errorMessage.includes("FaucetService error:")) {
        const match = errorMessage.match(/FaucetService error: (.+?)(?:\n|$)/);
        if (match) {
          friendlyMessage = match[1];
        }
      }

      console.log('🔴 ClaimSection: Final message to display:', friendlyMessage);

      addToast({
        type: "error",
        title: isRateLimitError ? "Rate Limited" : "Claim Failed",
        message: friendlyMessage,
        duration: isRateLimitError ? 10000 : 8000, // Show longer for rate limits
      });
    }
  }, [claimError, addToast]);

  // Show success when claim succeeds
  React.useEffect(() => {
    if (isClaimSuccess) {
      setShowSuccess(true);

      // Build success message
      const message =
        assetType === "native"
          ? `${selectedChain.amount} claimed successfully!`
          : assetType === "token"
            ? "100 DEV tokens claimed successfully!"
            : "Developer NFT minted successfully!";
      
      // Add transaction link if available
      const txLink = lastTransactionHash 
        ? `${selectedChain.blockExplorerUrl}/tx/${lastTransactionHash}`
        : null;
      
      console.log('Transaction link generated:', txLink);

      addToast({
        type: "success",
        title: "Success! 🎉",
        message,
        action: txLink ? {
          label: "View Transaction →",
          onClick: () => window.open(txLink, "_blank")
        } : undefined,
      });

      // Auto-hide alert after 5 seconds
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isClaimSuccess, addToast, selectedChain, assetType, lastTransactionHash]);

  // Unified claim handler
  const handleClaimTokens = async () => {
    if (!walletAddress) return;

    if (!isAuthenticated) {
      const { openAuthModal } = useAuthStore.getState();
      openAuthModal();
      return;
    }

    // Clear any existing errors before starting new claim
    console.log('🟡 ClaimSection: Starting new claim, clearing errors');
    setShowError(false);
    setShowSuccess(false);
    
    // Reset mutations to clear any previous error states
    claimTokenMutation.reset();
    mintNFTMutation.reset();

    const numericChainId = getNumericChainId(selectedChain.id);
    if (!numericChainId) {
      console.error(`Unsupported chain: ${selectedChain.id}`);
      return;
    }

    try {
      let result;
      if (assetType === "native") {
        result = await handleClaimNative();
      } else if (assetType === "token") {
        // Use the new claimDevToken endpoint that doesn't require assetId
        result = await claimTokenMutation.mutateAsync({
          chainId: numericChainId,
          walletAddress,
        });
      } else if (assetType === "nft") {
        result = await mintNFTMutation.mutateAsync({
          chainId: numericChainId,
          collectionId: "dev-nft", // Placeholder - backend will use the correct deployed DevNFT
          walletAddress,
          metadata: {
            name: nftPreview?.name ?? "Developer NFT",
            description: nftPreview?.description ?? "A unique developer NFT",
            image: nftPreview?.image ?? "/default-nft.png",
          },
        });
      }
      
      // Store the transaction hash if successful
      if (result?.transactionHash) {
        setLastTransactionHash(result.transactionHash);
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

        {/* Cooldown indicator */}
        {isAuthenticated && currentLimit && currentLimit.timeRemaining && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-amber-600 dark:text-amber-400">
                {assetType === "native" 
                  ? `Native tokens available in ${currentLimit.timeRemaining}`
                  : assetType === "token"
                    ? `DEV tokens available in ${currentLimit.timeRemaining}`
                    : `NFT minting available in ${currentLimit.timeRemaining}`
                }
              </span>
            </div>
          </div>
        )}

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
        {assetType === "nft" && nftPreview && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/10 animate-fade-in">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-blue-600/10">
              <img 
                src={nftPreview.image} 
                alt={nftPreview.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {nftPreview.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {nftPreview.description}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Testnet Collection
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-7 rounded-xl bg-card/20 backdrop-blur-md border border-border/20 hover:border-border/40 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-foreground">
            Wallet Address
          </label>
          <ClientOnly>
            <WalletAddressAutofill 
              walletAddress={walletAddress}
              hasUserEditedAddress={hasUserEditedAddress}
              setWalletAddress={(address) => {
                setWalletAddress(address);
                setHasUserEditedAddress(false);
              }}
            />
          </ClientOnly>
        </div>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => {
            setWalletAddress(e.target.value);
            setHasUserEditedAddress(true);
          }}
          placeholder="0x..."
          className="w-full px-6 py-5 bg-background/60 border border-border/30 rounded-xl text-lg text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:bg-background/80 focus:text-foreground transition-all duration-200"
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
          disabled={!walletAddress || authLoading || isClaimPending || (isAuthenticated && currentLimit && currentLimit.remaining === 0)}
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
                  : (isAuthenticated && currentLimit && currentLimit.remaining === 0 && currentLimit.timeRemaining)
                    ? `Available in ${currentLimit.timeRemaining}`
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
