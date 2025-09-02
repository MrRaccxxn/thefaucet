"use client";

import { ClaimSection } from "@/components/home/claim-section";
import { useNetworkStore, useInitialization } from "@/lib/stores";
import { useWalletConnection, useNetworkSwitcher } from "@/lib/hooks";
import { useCallback } from "react";
import { getNumericChainId } from "@/lib/stores/constants";
import { addNetworkToWallet } from "@/lib/utils/add-network";

export default function Home() {
  // Initialize app state
  useInitialization();

  // Get state from stores with specific selector
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1)_0%,transparent_50%)] animate-pulse"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin-slow"></div>
        </div>

        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(59, 130, 246, 0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <section className="container mx-auto px-6 py-32 md:py-40 lg:py-48">
          <div className="max-w-4xl mx-auto text-center">
            {/* Network Status Badge with Wallet Actions */}
            <button
              onClick={handleNetworkAction}
              disabled={isSwitching || (isConnected && isCorrectNetwork)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 backdrop-blur-sm text-sm text-muted-foreground mb-8 border border-border/20 animate-fade-in transition-all ${
                isConnected && isCorrectNetwork 
                  ? 'cursor-default' 
                  : 'hover:bg-muted/40 hover:text-primary hover:border-border/30 cursor-pointer'
              }`}
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
                {isSwitching ? (
                  'Switching...'
                ) : !isConnected ? (
                  'Connect Wallet'
                ) : !isCorrectNetwork ? (
                  `Switch to ${selectedChain.name}`
                ) : (
                  `Connected to ${selectedChain.name}`
                )}
              </span>
            </button>

            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 animate-fade-in-up ">
              The
              <span className="text-6xl md:text-9xl lg:text-10xl block font-medium bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient font-literata -mt-4 md:-mt-6 lg:-mt-8">
                faucet
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up-delayed">
              Get test tokens instantly across multiple blockchain networks.
            </p>

            {/* Main Interface */}
            <ClaimSection />
          </div>
        </section>
      </div>
    </div>
  );
}
