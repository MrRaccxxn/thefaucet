"use client"

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores';
import { signIn } from 'next-auth/react';

export function GitHubAuthModal() {
  const { showAuthModal, closeAuthModal, setLoading, isLoading } = useAuthStore();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAuthModal) {
        closeAuthModal();
      }
    };

    if (showAuthModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showAuthModal, closeAuthModal]);

  const handleGitHubAuth = async () => {
    setLoading(true);
    
    try {
      // Use NextAuth's signIn function to start GitHub OAuth flow
      const result = await signIn('github', {
        callbackUrl: '/dashboard', // Redirect to dashboard after successful auth
        redirect: true, // This will redirect to GitHub OAuth
      });
      
      // Note: This code won't execute immediately because of the redirect
      // The actual authentication result will be handled by NextAuth callbacks
      console.log('GitHub authentication initiated:', result);
      
    } catch (error) {
      console.error('GitHub authentication failed:', error);
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeAuthModal();
    }
  };

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
        <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground text-sm">
              Sign in to your account to start claiming test tokens
            </p>
          </div>

          {/* GitHub Auth Button */}
          <div className="space-y-4">
            <Button 
              onClick={handleGitHubAuth}
              disabled={isLoading}
              size="lg"
              className="w-full py-3 bg-[#24292e] hover:bg-[#1a1e22] text-white border-0"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {isLoading ? 'Connecting...' : 'Continue with GitHub'}
            </Button>

            {/* Terms */}
            <p className="text-xs text-muted-foreground text-center">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>

          {/* Requirements */}
          <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border/20">
            <h3 className="text-sm font-medium mb-3 text-center">GitHub Requirements</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                Account must be at least 30 days old
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                At least 5 followers
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                At least 1 public repository
              </li>
            </ul>
          </div>

          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
