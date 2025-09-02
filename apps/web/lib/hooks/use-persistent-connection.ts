"use client";

import { useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { injected } from '@wagmi/connectors'

const CONNECTOR_KEY = 'wagmi.connected'

export function usePersistentConnection() {
  const { isConnected } = useAccount()
  const { connect } = useConnect()

  useEffect(() => {
    // Check if user was previously connected
    const wasConnected = localStorage.getItem(CONNECTOR_KEY) === 'true'
    
    if (wasConnected && !isConnected) {
      // Try to reconnect with injected connector (MetaMask)
      connect({ connector: injected() })
    }
  }, [connect, isConnected])

  useEffect(() => {
    // Store connection state in localStorage
    if (isConnected) {
      localStorage.setItem(CONNECTOR_KEY, 'true')
    } else {
      localStorage.removeItem(CONNECTOR_KEY)
    }
  }, [isConnected])

  return { isConnected }
}

