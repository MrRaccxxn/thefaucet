"use client";

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  const getErrorMessage = (error: Error): string => {
    const message = error.message;
    
    // TRPC errors
    if (message.includes('TRPCClientError') || message.includes('FaucetService error')) {
      // Extract the actual error message from TRPCClientError
      const match = message.match(/FaucetService error: (.+?)(?:\n|$)/);
      if (match && match[1]) {
        return match[1];
      }
      return 'An error occurred while processing your request.';
    }
    
    // Time-based errors
    if (message.includes('You must wait') && message.includes('hours before claiming again')) {
      return message;
    }
    
    // Rate limiting errors - handle first to avoid generic network error
    if (message.includes('You have already claimed') || message.includes('Please wait') || message.includes('minutes before claiming again')) {
      return message; // Show the specific rate limit message
    }
    
    // Network errors - be more specific
    if (message.includes('Network error') || message.includes('fetch failed') || message.includes('connection failed')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  };

  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {getErrorMessage(error)}
          </p>
        </div>
        
        <Button 
          onClick={resetError} 
          variant="outline" 
          size="sm"
          className="inline-flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mt-4">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Error details (development only)
            </summary>
            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error; // This will be caught by the nearest error boundary
    }
  }, [error]);

  return { captureError, resetError };
}