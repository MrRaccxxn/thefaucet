"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useNetworkStore } from '@/lib/stores';

/**
 * Handles post-authentication cleanup:
 * 1. Restores selected network from session storage
 * 2. Cleans up ugly callback URLs from the address bar
 * 3. Provides smooth user experience after OAuth flow
 */
export function AuthCleanup() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelectedChain, chains, getChainBySlug } = useNetworkStore();

  useEffect(() => {
    // Only run cleanup after authentication is complete
    if (status !== 'authenticated' || !session) return;

    const cleanup = () => {
      let shouldReplaceUrl = false;
      const currentUrl = new URL(window.location.href);
      
      // Check if we have ugly callback parameters to clean
      const hasCallbackUrl = searchParams.has('callbackUrl');
      const hasAuthParams = currentUrl.search.includes('auth') || currentUrl.search.includes('callback');
      
      if (hasCallbackUrl || hasAuthParams) {
        shouldReplaceUrl = true;
      }

      // Restore network selection from session storage
      const storedNetwork = sessionStorage.getItem('auth-restore-network');
      if (storedNetwork) {
        console.log('🔄 Restoring network selection:', storedNetwork);
        
        const chainToRestore = getChainBySlug(storedNetwork);
        if (chainToRestore) {
          setSelectedChain(chainToRestore);
          
          // Update URL with clean network parameter
          currentUrl.searchParams.set('chain', storedNetwork);
          shouldReplaceUrl = true;
        }
        
        // Clean up session storage
        sessionStorage.removeItem('auth-restore-network');
      }

      // Clean up the URL if needed
      if (shouldReplaceUrl) {
        // Remove callback parameters
        currentUrl.searchParams.delete('callbackUrl');
        currentUrl.searchParams.delete('code');
        currentUrl.searchParams.delete('state');
        
        // Clean up any auth-related parameters
        ['auth', 'callback', 'signin', 'signout', 'error'].forEach(param => {
          currentUrl.searchParams.delete(param);
        });

        console.log('🧹 Cleaning URL from:', window.location.href);
        console.log('🧹 Cleaning URL to:', currentUrl.toString());
        
        // Replace the ugly URL with clean one
        router.replace(currentUrl.pathname + currentUrl.search, { scroll: false });
      }
    };

    // Small delay to ensure all auth state is settled
    const timeout = setTimeout(cleanup, 100);
    return () => clearTimeout(timeout);
    
  }, [session, status, router, searchParams, setSelectedChain, chains, getChainBySlug]);

  return null; // This component doesn't render anything
}