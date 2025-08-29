import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNetworkStore, useFormStore, useAuthStore } from '../index';
import { Chain } from '../types';

/**
 * Compound hook that provides high-level faucet actions
 * Combines multiple stores for complex operations
 */
export const useFaucetActions = () => {
  const router = useRouter();
  const { setSelectedChain } = useNetworkStore();
  const { walletAddress, redeemCode, resetForm } = useFormStore();
  const { isAuthenticated, setLoading } = useAuthStore();

  const handleNetworkChange = useCallback((chain: Chain) => {
    setSelectedChain(chain);
    // Update URL without full page reload
    router.push(`/${chain.slug}`, { scroll: false });
  }, [setSelectedChain, router]);

  const handleClaimTokens = useCallback(async () => {
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    if (!isAuthenticated) {
      // Open authentication modal instead of redirecting
      const { openAuthModal } = useAuthStore.getState();
      openAuthModal();
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Implement actual claim logic
      console.log('Claiming tokens...', {
        walletAddress,
        redeemCode: redeemCode || undefined,
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form on success
      resetForm();
      
      // TODO: Show success notification
      console.log('Tokens claimed successfully!');
      
    } catch (error) {
      console.error('Failed to claim tokens:', error);
      // TODO: Show error notification
    } finally {
      setLoading(false);
    }
  }, [walletAddress, redeemCode, isAuthenticated, setLoading, resetForm, router]);

  const canClaim = Boolean(walletAddress && isAuthenticated);

  return {
    handleNetworkChange,
    handleClaimTokens,
    canClaim,
  };
};
