import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your claim history and account information",
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Claims</CardDescription>
            <CardTitle className="text-2xl">--</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">--</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>NFTs Minted</CardDescription>
            <CardTitle className="text-2xl">--</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Networks Used</CardDescription>
            <CardTitle className="text-2xl">--</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump to common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-auto p-4 flex-col">
              <Link href="/claim/native">
                <span className="text-2xl mb-2">💰</span>
                <span>Claim Native Tokens</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex-col">
              <Link href="/claim/erc20">
                <span className="text-2xl mb-2">🪙</span>
                <span>Claim ERC20 Tokens</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-4 flex-col">
              <Link href="/claim/nft">
                <span className="text-2xl mb-2">🖼️</span>
                <span>Mint NFTs</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest claims and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start by claiming some test tokens!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your GitHub account and connected wallets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">GitHub Account</p>
                <p className="text-sm text-muted-foreground">Not connected</p>
              </div>
              <Button variant="outline">Connect GitHub</Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Wallet</p>
                <p className="text-sm text-muted-foreground">Not connected</p>
              </div>
              <Button variant="outline">Connect Wallet</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
