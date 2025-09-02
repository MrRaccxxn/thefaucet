"use client";

import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { useCallback } from 'react'
import { parseEther, type Address } from 'viem'

interface TransactionReturn {
  hash: `0x${string}` | undefined
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
  sendTransaction: any
  sendTransactionWithAmount: (to: string, amount: string) => void
}

export function useTransaction(): TransactionReturn {
  const { data, isPending, error, sendTransaction } = useSendTransaction()
  
  const { isLoading: isConfirming, isSuccess = false } = useWaitForTransactionReceipt({
    hash: data,
  })

  const sendTransactionWithAmount = useCallback((to: string, amount: string) => {
    sendTransaction({
      to: to as Address,
      value: parseEther(amount),
    })
  }, [sendTransaction])

  return {
    hash: data,
    isPending,
    isConfirming,
    isSuccess,
    error,
    sendTransaction,
    sendTransactionWithAmount,
  }
}
