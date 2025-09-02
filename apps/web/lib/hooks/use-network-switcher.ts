"use client";

import { useAccount, useSwitchChain } from 'wagmi'
import { useCallback } from 'react'
import { sepolia, polygonAmoy, bscTestnet } from 'wagmi/chains'

type SupportedChainId = typeof sepolia.id | typeof polygonAmoy.id | typeof bscTestnet.id

export function useNetworkSwitcher() {
  const { chain } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const switchToNetwork = useCallback((chainId: SupportedChainId) => {
    if (switchChain) {
      switchChain({ chainId })
    }
  }, [switchChain])

  const switchToSepolia = useCallback(() => {
    switchToNetwork(sepolia.id)
  }, [switchToNetwork])

  const switchToPolygonAmoy = useCallback(() => {
    switchToNetwork(polygonAmoy.id)
  }, [switchToNetwork])

  const switchToBscTestnet = useCallback(() => {
    switchToNetwork(bscTestnet.id)
  }, [switchToNetwork])

  const supportedChainIds = [sepolia.id, polygonAmoy.id, bscTestnet.id] as const
  const isSupportedNetwork = chain && supportedChainIds.includes(chain.id as SupportedChainId)

  return {
    chain,
    isSwitching,
    switchToNetwork,
    switchToSepolia,
    switchToPolygonAmoy,
    switchToBscTestnet,
    isSupportedNetwork,
    supportedChains: [sepolia, polygonAmoy, bscTestnet],
  }
}
