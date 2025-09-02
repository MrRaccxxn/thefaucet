import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  error: Error | null;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({ error, onDismiss, className }: ErrorAlertProps) {
  if (!error) return null;

  const getErrorMessage = (error: Error): string => {
    const message = error.message;
    
    // Time-based rate limiting errors
    if (message.includes('You must wait') && message.includes('hours before claiming again')) {
      return message; // Show the exact message with hours
    }
    
    // Generic rate limit errors
    if (message.includes('RateLimitExceeded') || message.includes('Rate limit exceeded')) {
      return 'You need to wait before claiming again. Please check the cooldown time.';
    }
    
    if (message.includes('InsufficientBalance') || message.includes('insufficient balance')) {
      return 'The faucet has insufficient balance. Please try again later.';
    }
    
    if (message.includes('User rejected') || message.includes('user rejected')) {
      return 'Transaction was cancelled.';
    }
    
    if (message.includes('Network error') || message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (message.includes('TokenMintFailed') || message.includes('NFTMintFailed')) {
      return 'Token minting failed. Please try again.';
    }
    
    // Generic fallback
    return message || 'An unexpected error occurred. Please try again.';
  };

  return (
    <div className={cn(
      'rounded-lg border border-red-200 bg-red-50 p-4 text-red-800',
      className
    )}>
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {getErrorMessage(error)}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}