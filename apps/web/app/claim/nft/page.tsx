import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Mint Test NFTs",
  description: "Mint test NFTs for development and testing",
}

export default function ClaimNFTPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🖼️</span>
            <span>NFT Minting</span>
          </CardTitle>
          <CardDescription>
            Mint test NFTs for your dApp development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* NFT Collections */}
          <div className="space-y-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">DevNFT Collection</CardTitle>
                <CardDescription>Basic ERC721 NFTs for testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-primary">Limit: 5 NFTs total</p>
                    <p className="text-sm text-muted-foreground">Per GitHub account</p>
                  </div>
                  <div className="space-y-2">
                    <select className="w-32 p-2 border rounded-md bg-background">
                      <option>Ethereum Sepolia</option>
                      <option>Polygon Amoy</option>
                      <option>BSC Testnet</option>
                    </select>
                    <Button className="w-32" disabled>
                      Mint NFT
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">TestArt Collection</CardTitle>
                <CardDescription>NFTs with metadata and images</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-primary">Limit: 3 NFTs total</p>
                    <p className="text-sm text-muted-foreground">Per GitHub account</p>
                  </div>
                  <div className="space-y-2">
                    <select className="w-32 p-2 border rounded-md bg-background">
                      <option>Ethereum Sepolia</option>
                      <option>Polygon Amoy</option>
                      <option>BSC Testnet</option>
                    </select>
                    <Button className="w-32" disabled>
                      Mint NFT
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* NFT Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">NFT Preview</CardTitle>
              <CardDescription>Example of what you'll mint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg mb-3"></div>
                  <p className="font-medium">DevNFT #1</p>
                  <p className="text-sm text-muted-foreground">Basic test NFT</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="w-full h-32 bg-gradient-to-br from-green-400 to-blue-600 rounded-lg mb-3"></div>
                  <p className="font-medium">DevNFT #2</p>
                  <p className="text-sm text-muted-foreground">Basic test NFT</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="w-full h-32 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg mb-3"></div>
                  <p className="font-medium">DevNFT #3</p>
                  <p className="text-sm text-muted-foreground">Basic test NFT</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
                <span>⚠️</span>
                <span className="font-medium">Authentication Required</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                Please sign in with GitHub and connect your wallet to mint NFTs.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
