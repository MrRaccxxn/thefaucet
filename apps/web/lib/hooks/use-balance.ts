"use client";

import { useBalance } from 'wagmi'
import { useAccount } from 'wagmi'

export function useWalletBalance() {
  const { address } = useAccount()
  
  const { data: balance, isLoading, error } = useBalance({
    address,
  })

  return {
    balance,
    isLoading,
    error,
    formattedBalance: balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.0000',
  }
}

