import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useNetworkStore, useThemeStore, useAppStore } from '../index';

/**
 * Hook that handles app initialization logic
 * Synchronizes URL with network state and applies theme
 */
export const useInitialization = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedChain = useNetworkStore((state) => state.selectedChain);
  const getChainBySlug = useNetworkStore((state) => state.getChainBySlug);
  const setSelectedChainWithoutUrl = useNetworkStore((state) => state.setSelectedChainWithoutUrl);
  const theme = useThemeStore((state) => state.theme);
  const isInitialized = useAppStore((state) => state.isInitialized);
  const setInitialized = useAppStore((state) => state.setInitialized);
  
  // Track initialization to prevent multiple runs
  const hasRunInitialSync = useRef(false);

  // One-time URL sync on mount
  useEffect(() => {
    if (hasRunInitialSync.current) return;
    
    const pathSegments = pathname.split('/');
    const networkSlug = pathSegments[1];
    const chainParam = searchParams.get('chain');
    
    // Handle path-based routing: redirect to parameter-based
    if (networkSlug && !chainParam && 
        networkSlug !== 'api' && networkSlug !== 'auth' && networkSlug !== 'dashboard' && 
        networkSlug !== 'claim' && networkSlug !== 'wallet-demo') {
      const chainFromPath = getChainBySlug(networkSlug);
      if (chainFromPath) {
        router.replace(`/?chain=${networkSlug}`);
        setSelectedChainWithoutUrl(chainFromPath);
        hasRunInitialSync.current = true;
        return;
      }
    }
    
    // Handle parameter-based chain selection on mount
    if (chainParam) {
      const chainFromParam = getChainBySlug(chainParam);
      if (chainFromParam) {
        setSelectedChainWithoutUrl(chainFromParam);
      }
    }
    
    hasRunInitialSync.current = true;
  }, []); // Empty deps - run exactly once

  // Apply theme on mount and changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // Mark app as initialized
  useEffect(() => {
    if (!isInitialized) {
      setInitialized(true);
    }
  }, [isInitialized, setInitialized]);

  const chains = useNetworkStore((state) => state.chains);
  
  return {
    isInitialized,
    selectedChain,
    availableChains: chains,
  };
};