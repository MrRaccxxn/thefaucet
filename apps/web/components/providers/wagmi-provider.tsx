"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'
import { useState, useEffect } from 'react'

export function WagmiAppProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  // Create QueryClient instance once per provider instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
      },
    },
  }))

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render on server side to avoid hydration mismatch
  if (!mounted) {
    return <div>{children}</div>
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

