"use client";

import { useEffect } from "react";
import { useWalletConnection } from "@/lib/hooks";

interface WalletAddressAutofillProps {
  walletAddress: string;
  hasUserEditedAddress: boolean;
  setWalletAddress: (address: string) => void;
}

export function WalletAddressAutofill({ 
  walletAddress, 
  hasUserEditedAddress, 
  setWalletAddress 
}: WalletAddressAutofillProps) {
  const { address: connectedWalletAddress, isConnected: isWalletConnected } = useWalletConnection();

  // Auto-fill wallet address when wallet connects (only if user hasn't edited)
  useEffect(() => {
    if (isWalletConnected && connectedWalletAddress && !walletAddress && !hasUserEditedAddress) {
      setWalletAddress(connectedWalletAddress);
    }
  }, [isWalletConnected, connectedWalletAddress, walletAddress, setWalletAddress, hasUserEditedAddress]);

  // Return button to use connected wallet if address differs
  if (isWalletConnected && connectedWalletAddress && walletAddress !== connectedWalletAddress) {
    return (
      <button
        onClick={() => {
          setWalletAddress(connectedWalletAddress);
        }}
        className="text-xs text-primary hover:text-primary/80 transition-colors"
      >
        Use connected wallet
      </button>
    );
  }

  return null;
}