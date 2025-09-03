"use client";

import { useEffect, useState } from 'react';

interface SafeWalletConnectionReturn {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: (connectorId: string) => void;
  disconnectWallet: () => void;
  connectors: readonly any[];
  error: Error | null;
}

// Safe hook that can be used anywhere, returns null state when not in provider
export function useSafeWalletConnection(): SafeWalletConnectionReturn {
  const [mounted, setMounted] = useState(false);
  const [walletData, setWalletData] = useState<SafeWalletConnectionReturn>({
    address: undefined,
    isConnected: false,
    isConnecting: false,
    connectWallet: () => {},
    disconnectWallet: () => {},
    connectors: [],
    error: null,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Dynamically import to avoid SSR issues
    import('./use-wallet-connection').then(({ useWalletConnection }) => {
      try {
        // This will be called in a client context where WagmiProvider exists
        const hookData = useWalletConnection();
        setWalletData(hookData);
      } catch (error) {
        console.warn('Wallet connection not available:', error);
      }
    });
  }, [mounted]);

  return walletData;
}