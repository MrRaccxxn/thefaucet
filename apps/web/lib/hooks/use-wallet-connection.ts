"use client";

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useCallback } from 'react'

interface WalletConnectionReturn {
  address: `0x${string}` | undefined
  isConnected: boolean
  isConnecting: boolean
  connectWallet: (connectorId: string) => void
  disconnectWallet: () => void
  connectors: readonly any[]
  error: Error | null
}

export function useWalletConnection(): WalletConnectionReturn {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, error: connectError, isPending: isConnectingWallet } = useConnect()
  const { disconnect } = useDisconnect()

  const connectWallet = useCallback((connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId)
    if (connector) {
      connect({ connector })
    }
  }, [connect, connectors])

  const disconnectWallet = useCallback(() => {
    disconnect()
  }, [disconnect])

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isConnectingWallet,
    connectWallet,
    disconnectWallet,
    connectors,
    error: connectError,
  }
}
