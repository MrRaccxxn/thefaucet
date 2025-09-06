"use client";

import { useState } from "react";
import React from "react";
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
import { api } from "@/lib/trpc/client";
import { getNumericChainId } from "@/lib/stores/constants";
import { NetworkDropdown } from "@/components/ui/network-dropdown";
import {
  AssetTypeSelector,
  ClaimButton,
  CooldownIndicator,
  NFTPreview,
  RedeemCodeSection,
  WalletAddressInput,
  type AssetType,
} from "@/components/claim";

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
  const [assetType, setAssetType] = useState<AssetType>("native");

  // Track success states separately for each asset type
  const [successStates, setSuccessStates] = useState<{
    native: { isSuccess: boolean; txHash: string | null };
    token: { isSuccess: boolean; txHash: string | null };
    nft: { isSuccess: boolean; txHash: string | null };
  }>({
    native: { isSuccess: false, txHash: null },
    token: { isSuccess: false, txHash: null },
    nft: { isSuccess: false, txHash: null },
  });

  // Track if user has manually edited the address
  const [hasUserEditedAddress, setHasUserEditedAddress] = useState(false);

  // Get chain ID and RPC URL
  const numericChainId = getNumericChainId(selectedChain.id);
  const rpcUrlMap: Record<number, string> = {
    11155111: "https://ethereum-sepolia-rpc.publicnode.com",
    4202: "https://rpc.sepolia-api.lisk.com",
    80002: "https://rpc-amoy.polygon.technology",
    97: "https://bsc-testnet.public.blastapi.io",
  };
  const rpcUrl = rpcUrlMap[numericChainId || 11155111];

  // Use the auth hook which syncs with NextAuth
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const {
    handleNetworkChange,
    handleClaimTokens: handleClaimNative,
    isClaimPending: isNativeClaimPending,
    claimError: nativeClaimError,
    isClaimSuccess: isNativeClaimSuccess,
    claimData: nativeClaimData,
  } = useFaucetActions();

  // Additional TRPC mutations for tokens and NFTs
  const claimTokenMutation = api.claim.claimDevToken.useMutation();
  const mintNFTMutation = api.claim.mintNFT.useMutation();

  // Get user limits for current chain
  const { data: limits } = api.claim.getLimits.useQuery(
    {
      chainId: numericChainId || 11155111,
      walletAddress: walletAddress,
    },
    {
      enabled: isAuthenticated && !!numericChainId && !!walletAddress,
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
  const { addToast } = useToast();

  // Determine which mutation is active
  const isClaimPending =
    isNativeClaimPending ||
    claimTokenMutation.isPending ||
    mintNFTMutation.isPending;
  const claimError =
    nativeClaimError || claimTokenMutation.error || mintNFTMutation.error;

  // Track success states per asset type
  const currentAssetSuccess = successStates[assetType];

  // Detect when individual mutations succeed
  const isTokenClaimSuccess = claimTokenMutation.isSuccess;
  const isNFTClaimSuccess = mintNFTMutation.isSuccess;

  // Show error when claim fails
  React.useEffect(() => {
    if (claimError) {
      setShowError(true);

      const errorMessage = claimError.message;
      const isRateLimitError =
        errorMessage.includes("You must wait") ||
        errorMessage.includes("You have already claimed") ||
        errorMessage.includes("Rate limit") ||
        errorMessage.includes("TOO_MANY_REQUESTS");

      let friendlyMessage = errorMessage;

      if (!isRateLimitError && errorMessage.includes("FaucetService error:")) {
        const match = errorMessage.match(/FaucetService error: (.+?)(?:\n|$)/);
        if (match) {
          friendlyMessage = match[1];
        }
      }

      addToast({
        type: "error",
        title: isRateLimitError ? "Rate Limited" : "Claim Failed",
        message: friendlyMessage,
        duration: isRateLimitError ? 10000 : 8000,
      });
    }
  }, [claimError, addToast]);

  // Handle native token success
  React.useEffect(() => {
    if (isNativeClaimSuccess && !successStates.native.isSuccess) {
      const txHash = nativeClaimData?.transactionHash || null;
      setSuccessStates((prev) => ({
        ...prev,
        native: { isSuccess: true, txHash },
      }));

      const message = `${selectedChain.amount} claimed successfully!`;
      addToast({
        type: "success",
        title: "Native Tokens Claimed! 🎉",
        message,
        action: txHash
          ? {
              label: "View Transaction →",
              onClick: () =>
                window.open(
                  `${selectedChain.blockExplorerUrl}/tx/${txHash}`,
                  "_blank"
                ),
            }
          : undefined,
      });

      if (assetType === "native") {
        setShowSuccess(true);
        const timer = setTimeout(() => setShowSuccess(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    isNativeClaimSuccess,
    successStates.native.isSuccess,
    selectedChain.amount,
    selectedChain.blockExplorerUrl,
    assetType,
    addToast,
    nativeClaimData,
  ]);

  // Handle token claim success
  React.useEffect(() => {
    if (isTokenClaimSuccess && !successStates.token.isSuccess) {
      const result = claimTokenMutation.data;
      const txHash = result?.transactionHash || null;
      setSuccessStates((prev) => ({
        ...prev,
        token: { isSuccess: true, txHash },
      }));

      const message = "100 DEV tokens claimed successfully!";
      const txLink = txHash
        ? `${selectedChain.blockExplorerUrl}/tx/${txHash}`
        : null;

      addToast({
        type: "success",
        title: "DEV Tokens Claimed! 🎉",
        message,
        action: txLink
          ? {
              label: "View Transaction →",
              onClick: () => window.open(txLink, "_blank"),
            }
          : undefined,
      });

      if (assetType === "token") {
        setShowSuccess(true);
        const timer = setTimeout(() => setShowSuccess(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    isTokenClaimSuccess,
    successStates.token.isSuccess,
    selectedChain.blockExplorerUrl,
    assetType,
    addToast,
    claimTokenMutation.data,
  ]);

  // Handle NFT mint success
  React.useEffect(() => {
    if (isNFTClaimSuccess && !successStates.nft.isSuccess) {
      const result = mintNFTMutation.data;
      const txHash = result?.transactionHash || null;
      setSuccessStates((prev) => ({
        ...prev,
        nft: { isSuccess: true, txHash },
      }));

      const message = "Developer NFT minted successfully!";
      const txLink = txHash
        ? `${selectedChain.blockExplorerUrl}/tx/${txHash}`
        : null;

      addToast({
        type: "success",
        title: "NFT Minted! 🎉",
        message,
        action: txLink
          ? {
              label: "View Transaction →",
              onClick: () => window.open(txLink, "_blank"),
            }
          : undefined,
      });

      if (assetType === "nft") {
        setShowSuccess(true);
        const timer = setTimeout(() => setShowSuccess(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    isNFTClaimSuccess,
    successStates.nft.isSuccess,
    selectedChain.blockExplorerUrl,
    assetType,
    addToast,
    mintNFTMutation.data,
  ]);

  // Unified claim handler
  const handleClaimTokens = async () => {
    if (!walletAddress) return;

    if (!isAuthenticated) {
      const { openAuthModal } = useAuthStore.getState();
      openAuthModal();
      return;
    }

    // Clear any existing errors before starting new claim
    setShowError(false);
    setShowSuccess(false);

    // Reset success state for current asset type only
    setSuccessStates((prev) => ({
      ...prev,
      [assetType]: { isSuccess: false, txHash: null },
    }));

    // Reset mutations to clear any previous error states
    claimTokenMutation.reset();
    mintNFTMutation.reset();

    const chainId = getNumericChainId(selectedChain.id);
    if (!chainId) {
      console.error(`Unsupported chain: ${selectedChain.id}`);
      return;
    }

    try {
      if (assetType === "native") {
        await handleClaimNative();
      } else if (assetType === "token") {
        await claimTokenMutation.mutateAsync({
          chainId,
          walletAddress,
        });
      } else if (assetType === "nft") {
        // Get NFT metadata for minting
        const nftName = "Developer NFT";
        const nftDescription = "A unique developer NFT";
        const nftImage = "/default-nft.png";

        await mintNFTMutation.mutateAsync({
          chainId,
          collectionId: "dev-nft",
          walletAddress,
          metadata: {
            name: nftName,
            description: nftDescription,
            image: nftImage,
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
      {showSuccess && currentAssetSuccess.isSuccess && (
        <SuccessAlert
          message={
            assetType === "native"
              ? `${selectedChain.amount} claimed successfully!`
              : assetType === "token"
                ? "100 DEV tokens claimed successfully!"
                : "Developer NFT minted successfully!"
          }
          txHash={
            currentAssetSuccess.txHash &&
            currentAssetSuccess.txHash !== "pending"
              ? currentAssetSuccess.txHash
              : undefined
          }
          explorerUrl={selectedChain.blockExplorerUrl}
          onDismiss={() => setShowSuccess(false)}
        />
      )}

      {/* Network and Asset Selector */}
      <div className="p-5 rounded-xl bg-card/20 backdrop-blur-md border border-border/20 hover:border-border/40 transition-all duration-300">
        <div className="flex items-center justify-end mb-4">
          <AssetTypeSelector
            assetType={assetType}
            onAssetTypeChange={setAssetType}
            selectedChainAmount={selectedChain.amount}
          />
        </div>

        {/* Cooldown indicator */}
        {isAuthenticated && currentLimit && currentLimit.timeRemaining && (
          <CooldownIndicator
            assetType={assetType}
            timeRemaining={currentLimit.timeRemaining}
          />
        )}

        {/* Network selection dropdown */}
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
          <NFTPreview
            chainId={numericChainId || 11155111}
            rpcUrl={rpcUrl}
          />
        )}
      </div>

      {/* Wallet Address Input */}
      <WalletAddressInput
        walletAddress={walletAddress}
        hasUserEditedAddress={hasUserEditedAddress}
        onWalletAddressChange={setWalletAddress}
        onUserEdit={setHasUserEditedAddress}
      />

      {/* Redeem Code Section */}
      <RedeemCodeSection
        redeemCode={redeemCode}
        showRedeemCode={showRedeemCode}
        onRedeemCodeChange={setRedeemCode}
        onToggleRedeemCode={() => setShowRedeemCode(!showRedeemCode)}
      />

      {/* Claim Button */}
      <ClaimButton
        assetType={assetType}
        walletAddress={walletAddress}
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        isClaimPending={isClaimPending}
        currentLimit={currentLimit || undefined}
        selectedChainAmount={selectedChain.amount}
        userNickname={user?.nickname}
        onClaim={handleClaimTokens}
      />
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