"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "Access was denied. Your GitHub account may not meet the requirements for using this faucet.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      case "OAuthSignin":
        return "Error in constructing an authorization URL.";
      case "OAuthCallback":
        return "Error in handling the response from the OAuth provider.";
      case "OAuthCreateAccount":
        return "Could not create OAuth provider user in the database.";
      case "EmailCreateAccount":
        return "Could not create email provider user in the database.";
      case "Callback":
        return "Error in the OAuth callback handler route.";
      case "OAuthAccountNotLinked":
        return "This account is already associated with another user.";
      case "EmailSignin":
        return "Check your email for the verification link.";
      case "CredentialsSignin":
        return "Sign in failed. Check the details you provided are correct.";
      case "GitHubValidation":
        return "Your GitHub account doesn't meet the requirements for using this faucet.";
      default:
        return "An unexpected error occurred during authentication.";
    }
  };

  const getErrorDetails = (error: string | null) => {
    if (error === "AccessDenied" || error === "GitHubValidation") {
      return (
        <div className="text-left space-y-2">
          <p className="font-medium">Requirements:</p>
          <ul className="text-sm space-y-1">
            <li>• Account must be at least 30 days old</li>
            <li>• Must have at least 5 followers</li>
            <li>• Must have at least 1 public repository</li>
            <li>• Must have a verified email address</li>
          </ul>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-destructive/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <svg 
            className="w-10 h-10 text-destructive" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
        <p className="text-muted-foreground mb-6">
          {getErrorMessage(error)}
        </p>
        
        {getErrorDetails(error) && (
          <div className="bg-muted rounded-lg p-4 mb-6">
            {getErrorDetails(error)}
          </div>
        )}
        
        {error && (
          <div className="bg-muted rounded-lg p-3 mb-6">
            <code className="text-sm">Error code: {error}</code>
          </div>
        )}
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">Try Again</Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-6">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}