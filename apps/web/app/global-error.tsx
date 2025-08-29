"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-destructive">Critical Error</CardTitle>
              <CardDescription>
                A critical error occurred. The application needs to restart.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <p className="font-mono">{error.message}</p>
                  {error.digest && (
                    <p className="text-xs mt-2">Error ID: {error.digest}</p>
                  )}
                </div>
              )}
              <div className="flex justify-center">
                <Button onClick={reset}>
                  Restart Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
