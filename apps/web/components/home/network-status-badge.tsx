"use client";

import { useWalletConnection, useNetworkSwitcher } from "@/lib/hooks";
import { useNetworkStore } from "@/lib/stores";
import { getNumericChainId } from "@/lib/stores/constants";
import { addNetworkToWallet } from "@/lib/utils/add-network";
import { useCallback } from "react";

export function NetworkStatusBadge() {
  const selectedChain = useNetworkStore((state) => state.selectedChain);
  
  // Wallet connection hooks
  const { isConnected, address, connectWallet, connectors } = useWalletConnection();
  const { chain: currentWalletChain, switchToNetwork, isSwitching } = useNetworkSwitcher();
  
  // Get the numeric chain ID for the selected chain
  const selectedChainId = getNumericChainId(selectedChain.id);
  
  // Check if wallet is on the correct network
  const isCorrectNetwork = currentWalletChain?.id === selectedChainId;
  const hasNetwork = currentWalletChain !== undefined;
  
  // Handle network actions
  const handleNetworkAction = useCallback(async () => {
    if (!isConnected) {
      // Connect wallet - use first available connector (usually MetaMask)
      const connector = connectors[0];
      if (connector) {
        connectWallet(connector.id);
      }
    } else if (!isCorrectNetwork && selectedChainId) {
      // Try to add/switch network
      try {
        await addNetworkToWallet(selectedChainId);
      } catch (error) {
        console.error('Failed to add/switch network:', error);
      }
    }
  }, [isConnected, isCorrectNetwork, selectedChainId, connectWallet, connectors]);

  // Determine the status badge content
  const getStatusContent = () => {
    if (!isConnected) {
      return {
        message: "Connect Wallet",
        pulseColor: "bg-yellow-400",
        showPulse: false,
        icon: "🔗",
        clickable: true
      };
    }
    
    if (!hasNetwork) {
      return {
        message: "Add Network",
        pulseColor: "bg-yellow-400",
        showPulse: false,
        icon: "➕",
        clickable: true
      };
    }
    
    if (!isCorrectNetwork) {
      return {
        message: `Switch to ${selectedChain.name}`,
        pulseColor: "bg-yellow-400",
        showPulse: false,
        icon: "🔄",
        clickable: true
      };
    }
    
    return {
      message: `Connected to ${selectedChain.name}`,
      pulseColor: "bg-green-400",
      showPulse: true,
      icon: null,
      clickable: false
    };
  };

  const status = getStatusContent();

  return (
    <button
      onClick={status.clickable ? handleNetworkAction : undefined}
      disabled={isSwitching || !status.clickable}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 backdrop-blur-sm text-sm text-muted-foreground mb-8 border border-border/20 animate-fade-in transition-all ${
        status.clickable 
          ? 'hover:bg-muted/40 hover:text-primary hover:border-border/30 cursor-pointer' 
          : 'cursor-default'
      } ${isSwitching ? 'opacity-50' : ''}`}
    >
      {/* Contextual icon based on state */}
      {!isConnected ? (
        // Wallet icon for connect
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ) : !isCorrectNetwork ? (
        // Switch icon for network change
        <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ) : (
        // Green pulse dot when connected correctly
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      )}
      
      {/* Show appropriate message based on wallet/network state */}
      <span className="text-sm">
        {isSwitching ? "Switching..." : status.message}
      </span>
    </button>
  );
}