"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConnectButton, NetworkSwitcher, WalletInfo } from "@/components/wallet"
import { useWalletConnection, useNetworkSwitcher, useWalletBalance, useTransaction } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { parseEther } from "viem"

export default function WalletDemoPage() {
  const { isConnected, address } = useWalletConnection()
  const { chain, isSupportedNetwork } = useNetworkSwitcher()
  const { formattedBalance } = useWalletBalance()
  const { sendTransactionWithAmount, isPending, isSuccess, error } = useTransaction()
  
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")

  const handleSendTransaction = () => {
    if (recipient && amount) {
      sendTransactionWithAmount(recipient, amount)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Wallet Integration Demo</h1>
          <p className="text-muted-foreground">
            Test the wallet connection, network switching, and transaction features
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <span className={isConnected ? "text-green-500" : "text-red-500"}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            {address && (
              <div className="flex items-center justify-between">
                <span>Address:</span>
                <code className="text-sm">{address}</code>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Network:</span>
              <span className={isSupportedNetwork ? "text-green-500" : "text-yellow-500"}>
                {chain?.name || "Unknown"}
                {!isSupportedNetwork && " (Unsupported)"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Balance:</span>
              <span>{formattedBalance}</span>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <ConnectButton />
              <NetworkSwitcher />
            </div>
          </CardContent>
        </Card>

        {/* Wallet Info */}
        {isConnected && <WalletInfo />}

        {/* Transaction Demo */}
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Send Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient Address</label>
                <Input
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (ETH)</label>
                <Input
                  type="number"
                  step="0.001"
                  placeholder="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSendTransaction}
                disabled={isPending || !recipient || !amount}
                className="w-full"
              >
                {isPending ? "Sending..." : "Send Transaction"}
              </Button>
              {isSuccess && (
                <div className="text-green-500 text-sm">
                  Transaction sent successfully!
                </div>
              )}
              {error && (
                <div className="text-red-500 text-sm">
                  Error: {error.message}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Connect Wallet</h4>
              <p className="text-sm text-muted-foreground">
                Click the "Connect Wallet" button and select your preferred wallet provider (MetaMask, WalletConnect, etc.)
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">2. Switch Networks</h4>
              <p className="text-sm text-muted-foreground">
                Use the network switcher to switch between Ethereum Sepolia, Polygon Amoy, and BSC Testnet
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">3. View Wallet Info</h4>
              <p className="text-sm text-muted-foreground">
                Once connected, you'll see your wallet address, balance, and can copy your address
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">4. Send Test Transaction</h4>
              <p className="text-sm text-muted-foreground">
                Enter a recipient address and amount to test sending transactions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

