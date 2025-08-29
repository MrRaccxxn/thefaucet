import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNetworkStore, useThemeStore, useAppStore } from '../index';

/**
 * Hook that handles app initialization logic
 * Synchronizes URL with network state and applies theme
 */
export const useInitialization = () => {
  const pathname = usePathname();
  const { chains, selectedChain, setSelectedChain, getChainBySlug } = useNetworkStore();
  const { theme } = useThemeStore();
  const { isInitialized, setInitialized } = useAppStore();

  // Initialize network from URL
  useEffect(() => {
    const pathSegments = pathname.split('/');
    const networkSlug = pathSegments[1]; // First segment after /
    
    if (networkSlug) {
      const chainFromUrl = getChainBySlug(networkSlug);
      if (chainFromUrl && chainFromUrl.id !== selectedChain.id) {
        setSelectedChain(chainFromUrl);
      }
    }
  }, [pathname, getChainBySlug, selectedChain.id, setSelectedChain]);

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

  return {
    isInitialized,
    selectedChain,
    availableChains: chains,
  };
};
