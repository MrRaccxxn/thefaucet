"use client";

import { Button } from "@/components/ui/button"
import { useWalletConnection } from "@/lib/hooks"
import { Wallet } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ConnectButton() {
  const { 
    isConnected, 
    disconnectWallet, 
    address 
  } = useWalletConnection()

  // Only show when wallet is connected
  if (!isConnected) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <Wallet className="h-3 w-3" />
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={disconnectWallet}>
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
