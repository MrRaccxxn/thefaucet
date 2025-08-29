"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  useNetworkStore, 
  useFormStore, 
  useAuthStore, 
  useFaucetActions,
  useInitialization 
} from "@/lib/stores";

export default function Home() {
  // Initialize app state
  useInitialization();
  
  // Get state from stores
  const { chains, selectedChain } = useNetworkStore();
  const { 
    walletAddress, 
    redeemCode, 
    showRedeemCode, 
    setWalletAddress, 
    setRedeemCode, 
    setShowRedeemCode 
  } = useFormStore();
  const { isAuthenticated, isLoading } = useAuthStore();
  
  // Get actions
  const { handleNetworkChange, handleClaimTokens, canClaim } = useFaucetActions();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1)_0%,transparent_50%)] animate-pulse"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-full blur-3xl animate-spin-slow"></div>
        </div>
        
        {/* Subtle dot pattern overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <section className="container mx-auto px-6 py-32 md:py-40 lg:py-48">
          <div className="max-w-4xl mx-auto text-center">
            {/* Network Status Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted/30 backdrop-blur-sm text-sm text-muted-foreground mb-8 border border-border/20 animate-fade-in">
              <div className={`w-2 h-2 rounded-full ${selectedChain.color.replace('bg-', 'bg-')} mr-2 animate-pulse`}></div>
              Connected to {selectedChain.name}
            </div>
            
            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight mb-8 animate-fade-in-up">
              The
              <span className="block font-medium bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Faucet
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up-delayed">
              Get test tokens instantly across multiple blockchain networks.
              <span className="block mt-2 text-base opacity-75">GitHub verification required.</span>
            </p>
            
            {/* Main Interface */}
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
                  disabled={!walletAddress || isLoading}
                >
                  {isLoading ? 'Processing...' :
                   !walletAddress ? 'Enter Wallet Address' : 
                   !isAuthenticated ? '🔒 Authenticate with GitHub to Claim' : 
                   'Claim Test Tokens'}
                </Button>
                
                {walletAddress && !isAuthenticated && (
                  <p className="text-xs text-muted-foreground/60 mt-2 text-center">
                    Click to authenticate with GitHub and claim {selectedChain.amount}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}