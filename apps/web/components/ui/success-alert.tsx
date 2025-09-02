import { CheckCircle, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessAlertProps {
  message: string;
  txHash?: string;
  explorerUrl?: string;
  onDismiss?: () => void;
  className?: string;
}

export function SuccessAlert({ 
  message, 
  txHash, 
  explorerUrl, 
  onDismiss, 
  className 
}: SuccessAlertProps) {
  const txUrl = txHash && explorerUrl ? `${explorerUrl}/tx/${txHash}` : null;

  return (
    <div className={cn(
      'rounded-lg border border-green-200 bg-green-50 p-4 text-green-800',
      className
    )}>
      <div className="flex items-start">
        <CheckCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">
            {message}
          </p>
          {txUrl && (
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-green-600 hover:text-green-800 underline"
            >
              View transaction
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 text-green-400 hover:text-green-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}