import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">The Faucet</h3>
            <p className="text-sm text-muted-foreground">
              A multichain testnet faucet for developers. Get test tokens for Ethereum, Polygon, BSC, and more.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Claim Assets</h4>
            <div className="space-y-2 text-sm">
              <Link href="/claim/native" className="block text-muted-foreground hover:text-foreground">
                Native Tokens
              </Link>
              <Link href="/claim/erc20" className="block text-muted-foreground hover:text-foreground">
                ERC20 Tokens
              </Link>
              <Link href="/claim/nft" className="block text-muted-foreground hover:text-foreground">
                NFTs
              </Link>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Account</h4>
            <div className="space-y-2 text-sm">
              <Link href="/dashboard" className="block text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/dashboard/claims" className="block text-muted-foreground hover:text-foreground">
                Claim History
              </Link>
              <Link href="/auth/login" className="block text-muted-foreground hover:text-foreground">
                Sign In
              </Link>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Resources</h4>
            <div className="space-y-2 text-sm">
              <Link href="/redeem" className="block text-muted-foreground hover:text-foreground">
                Redeem Code
              </Link>
              <Link href="https://github.com" className="block text-muted-foreground hover:text-foreground">
                GitHub
              </Link>
              <Link href="/docs" className="block text-muted-foreground hover:text-foreground">
                Documentation
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 The Faucet. Built for developers, by developers.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
