"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWalletConnection, useWalletBalance } from "@/lib/hooks"
import { Wallet, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function WalletInfo() {
  const { address, isConnected } = useWalletConnection()
  const { formattedBalance, isLoading } = useWalletBalance()
  const [copied, setCopied] = useState(false)

  if (!isConnected || !address) {
    return null
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Address
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-2 py-1 text-sm">
              {address}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAddress}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Balance
          </label>
          <div className="text-lg font-semibold">
            {isLoading ? 'Loading...' : formattedBalance}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

