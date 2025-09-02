"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Chain } from "@/lib/stores/types"

interface NetworkDropdownProps {
  chains: Chain[]
  selectedChain: Chain
  onSelect: (chain: Chain) => void
  className?: string
}

export function NetworkDropdown({
  chains,
  selectedChain,
  onSelect,
  className
}: NetworkDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Sort chains to show recently used or popular ones first
  const sortedChains = React.useMemo(() => {
    // For now, just return chains as-is
    // In the future, you could sort by usage frequency
    return chains
  }, [chains])

  const filteredChains = React.useMemo(() => {
    if (!search) return sortedChains
    
    const searchLower = search.toLowerCase()
    return sortedChains.filter(chain => 
      chain.name.toLowerCase().includes(searchLower) ||
      chain.id.toLowerCase().includes(searchLower)
    )
  }, [sortedChains, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            "bg-background/60 border-border/30",
            "hover:bg-background/80 hover:border-border/50",
            "transition-all duration-200",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${selectedChain.color}`} />
            <span className="text-sm">{selectedChain.name}</span>
          </div>
          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search networks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandEmpty className="py-6 text-center text-sm">
            No network found.
          </CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {filteredChains.map((chain) => (
              <CommandItem
                key={chain.id}
                value={chain.id}
                onSelect={() => {
                  onSelect(chain)
                  setOpen(false)
                  setSearch("")
                }}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer"
              >
                <div className={`w-2 h-2 rounded-full ${chain.color}`} />
                <div className="flex-1">
                  <div className="text-sm">{chain.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {chain.amount}
                  </div>
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    selectedChain.id === chain.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}