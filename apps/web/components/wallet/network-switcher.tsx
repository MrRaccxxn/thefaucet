"use client";

import { Button } from "@/components/ui/button"
import { useNetworkSwitcher } from "@/lib/hooks"
import { Network, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NetworkSwitcher() {
  const { 
    chain, 
    isSwitching, 
    switchToSepolia, 
    switchToPolygonAmoy, 
    switchToBscTestnet,
    switchToLiskSepolia,
    isSupportedNetwork 
  } = useNetworkSwitcher()

  if (!chain) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isSwitching} className="gap-2">
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Network className="h-4 w-4" />
          )}
          {isSwitching ? 'Switching...' : chain.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={switchToSepolia}>
          Ethereum Sepolia
        </DropdownMenuItem>
        <DropdownMenuItem onClick={switchToLiskSepolia}>
          Lisk Sepolia
        </DropdownMenuItem>
        <DropdownMenuItem onClick={switchToPolygonAmoy}>
          Polygon Amoy
        </DropdownMenuItem>
        <DropdownMenuItem onClick={switchToBscTestnet}>
          BSC Testnet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

