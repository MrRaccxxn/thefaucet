"use client"

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { 
  useNetworkStore, 
  useFormStore, 
  useAuthStore, 
  useFaucetActions
} from "@/lib/stores";

export function ClaimSection() {
  const { chains, selectedChain } = useNetworkStore();
  const { 
    walletAddress, 
    redeemCode, 
    showRedeemCode, 
    setWalletAddress, 
    setRedeemCode, 
    setShowRedeemCode 
  } = useFormStore();
  
  // Use the auth hook which syncs with NextAuth
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  const { handleNetworkChange, handleClaimTokens } = useFaucetActions();

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in-up-delayed-2">
      {/* Minimalistic Network Selector */}
      <div className="p-4 rounded-xl bg-card/20 backdrop-blur-md border border-border/20 hover:border-border/40 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">Network</span>
          <span className="text-xs font-medium text-primary">{selectedChain.amount}</span>
        </div>
        <div className="flex gap-1">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => handleNetworkChange(chain)}
              className={`flex-1 p-2 rounded-lg text-xs transition-all duration-200 ${
                selectedChain.id === chain.id
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-muted/10 border border-transparent'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${chain.color} mx-auto mb-1`}></div>
              {chain.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Prominent Wallet Input */}
      <div className="p-6 rounded-xl bg-card/20 backdrop-blur-md border border-border/20 hover:border-border/40 transition-all duration-300">
        <label className="block text-sm font-medium text-foreground mb-4">
          Wallet Address
        </label>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="0x..."
          className="w-full px-5 py-4 bg-background/60 border border-border/30 rounded-xl text-base placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:bg-background/80 transition-all duration-200"
        />
      </div>

      {/* Redeem Code Section */}
      <div className="space-y-3">
        <button
          onClick={() => setShowRedeemCode(!showRedeemCode)}
          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center mx-auto"
        >
          <span className="mr-1">✨</span>
          Have a redeem code?
          <span className="ml-1">{showRedeemCode ? '−' : '+'}</span>
        </button>
        
        {showRedeemCode && (
          <div className="p-4 rounded-xl bg-card/20 backdrop-blur-md border border-border/20 hover:border-border/40 transition-all duration-300 animate-fade-in">
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Redeem Code (Optional)
            </label>
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value)}
              placeholder="Enter code for boosted rewards"
              className="w-full px-4 py-3 bg-background/50 border border-border/30 rounded-lg text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Single Claim Button with Auth Integration */}
      <div className="pt-4">
        <Button 
          size="lg" 
          onClick={handleClaimTokens}
          className="w-full py-4 text-base font-medium bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!walletAddress || authLoading}
        >
          {authLoading ? 'Loading...' :
           !walletAddress ? 'Enter Wallet Address' : 
           !isAuthenticated ? '🔒 Authenticate with GitHub to Claim' : 
           `Claim ${selectedChain.amount}`}
        </Button>
        
        {walletAddress && !isAuthenticated && !authLoading && (
          <p className="text-xs text-muted-foreground/60 mt-2 text-center">
            Click to authenticate with GitHub and claim {selectedChain.amount}
          </p>
        )}
        
        {isAuthenticated && user && (
          <p className="text-xs text-muted-foreground/60 mt-2 text-center">
            Authenticated as {user.username}
          </p>
        )}
      </div>
    </div>
  );
}