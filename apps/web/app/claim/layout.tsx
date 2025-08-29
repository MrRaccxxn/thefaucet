import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClaimLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Claim Test Assets</h1>
          <p className="text-muted-foreground">
            Get test tokens and NFTs for your development needs
          </p>
        </div>
        
        <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 text-lg">
              📋 Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• GitHub account with at least 5 followers</li>
              <li>• Account must be at least 30 days old</li>
              <li>• Must have at least 3 public repositories</li>
              <li>• Connected wallet address</li>
            </ul>
          </CardContent>
        </Card>

        {children}
      </div>
    </div>
  )
}
