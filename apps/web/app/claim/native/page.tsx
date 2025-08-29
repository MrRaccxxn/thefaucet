import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Claim Native Tokens",
  description: "Claim native test tokens like ETH, MATIC, and BNB for development",
}

export default function ClaimNativePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>💰</span>
            <span>Native Token Claims</span>
          </CardTitle>
          <CardDescription>
            Claim native test tokens for blockchain development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Network Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span>🔷</span>
                  <span>Ethereum Sepolia</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">0.02 ETH</p>
                <p className="text-sm text-muted-foreground mb-4">Available every 24 hours</p>
                <Button className="w-full" disabled>
                  Connect Wallet to Claim
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span>🟣</span>
                  <span>Polygon Amoy</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">0.02 MATIC</p>
                <p className="text-sm text-muted-foreground mb-4">Available every 24 hours</p>
                <Button className="w-full" disabled>
                  Connect Wallet to Claim
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span>🟡</span>
                  <span>BSC Testnet</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">0.02 BNB</p>
                <p className="text-sm text-muted-foreground mb-4">Available every 24 hours</p>
                <Button className="w-full" disabled>
                  Connect Wallet to Claim
                </Button>
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
                Please sign in with GitHub and connect your wallet to claim native tokens.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
