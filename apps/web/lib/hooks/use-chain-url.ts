"use client"

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { useNetworkStore } from '@/lib/stores'
import { Chain } from '@/lib/stores/types'

export function useChainUrl() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { setSelectedChain, getChainBySlug } = useNetworkStore()

  const updateChainInUrl = useCallback((chain: Chain) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('chain', chain.slug)
    
    const newUrl = `${pathname}?${params.toString()}`
    router.replace(newUrl, { scroll: false })
  }, [router, searchParams, pathname])

  const getChainFromUrl = useCallback(() => {
    const chainParam = searchParams.get('chain')
    if (chainParam) {
      return getChainBySlug(chainParam)
    }
    return null
  }, [searchParams, getChainBySlug])

  const setChainFromUrl = useCallback((chainSlug: string) => {
    const chain = getChainBySlug(chainSlug)
    if (chain) {
      setSelectedChain(chain)
      updateChainInUrl(chain)
    }
  }, [getChainBySlug, setSelectedChain, updateChainInUrl])

  const setChainFromState = useCallback((chain: Chain) => {
    setSelectedChain(chain)
    updateChainInUrl(chain)
  }, [setSelectedChain, updateChainInUrl])

  return {
    updateChainInUrl,
    getChainFromUrl,
    setChainFromUrl,
    setChainFromState
  }
}