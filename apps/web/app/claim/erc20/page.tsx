import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Claim ERC20 Tokens",
  description: "Claim test ERC20 tokens for development and testing",
}

export default function ClaimERC20Page() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🪙</span>
            <span>ERC20 Token Claims</span>
          </CardTitle>
          <CardDescription>
            Claim test ERC20 tokens for smart contract development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Selection */}
          <div className="space-y-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">DevToken (DEVT)</CardTitle>
                <CardDescription>Standard ERC20 token for testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">1,000 DEVT</p>
                    <p className="text-sm text-muted-foreground">Available every 24 hours</p>
                  </div>
                  <div className="space-y-2">
                    <select className="w-32 p-2 border rounded-md bg-background">
                      <option>Ethereum Sepolia</option>
                      <option>Polygon Amoy</option>
                      <option>BSC Testnet</option>
                    </select>
                    <Button className="w-32" disabled>
                      Claim Tokens
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">TestUSDC (TUSDC)</CardTitle>
                <CardDescription>USDC-like token for DeFi testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">100 TUSDC</p>
                    <p className="text-sm text-muted-foreground">Available every 24 hours</p>
                  </div>
                  <div className="space-y-2">
                    <select className="w-32 p-2 border rounded-md bg-background">
                      <option>Ethereum Sepolia</option>
                      <option>Polygon Amoy</option>
                      <option>BSC Testnet</option>
                    </select>
                    <Button className="w-32" disabled>
                      Claim Tokens
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">TestDAI (TDAI)</CardTitle>
                <CardDescription>DAI-like token for testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">100 TDAI</p>
                    <p className="text-sm text-muted-foreground">Available every 24 hours</p>
                  </div>
                  <div className="space-y-2">
                    <select className="w-32 p-2 border rounded-md bg-background">
                      <option>Ethereum Sepolia</option>
                      <option>Polygon Amoy</option>
                      <option>BSC Testnet</option>
                    </select>
                    <Button className="w-32" disabled>
                      Claim Tokens
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Card */}
          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
                <span>⚠️</span>
                <span className="font-medium">Authentication Required</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                Please sign in with GitHub and connect your wallet to claim ERC20 tokens.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
