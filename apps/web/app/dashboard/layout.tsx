import { Card, CardContent } from "@/components/ui/card"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your claims and account settings
          </p>
        </div>
        
        {/* Auth Required Message */}
        <Card className="mb-6 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
              <span>🔒</span>
              <span className="font-medium">Authentication Required</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              Please sign in with GitHub to access your dashboard.
            </p>
          </CardContent>
        </Card>

        {children}
      </div>
    </div>
  )
}
