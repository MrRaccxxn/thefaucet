import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNetworkStore, useFormStore, useAuthStore } from '../index';
import { Chain } from '../types';
import { api } from '../../trpc/client';

/**
 * Compound hook that provides high-level faucet actions
 * Combines multiple stores for complex operations
 */
export const useFaucetActions = (): {
  handleNetworkChange: (chain: Chain) => void;
  handleClaimTokens: () => Promise<void>;
  canClaim: boolean;
  isClaimPending: boolean;
  claimError: any;
  isClaimSuccess: boolean;
} => {
  const router = useRouter();
  const { setSelectedChain } = useNetworkStore();
  const { walletAddress, redeemCode, resetForm } = useFormStore();
  const { isAuthenticated, setLoading } = useAuthStore();
  const claimNativeTRPC = api.claim.claimNative.useMutation();

  const handleNetworkChange = useCallback((chain: Chain) => {
    setSelectedChain(chain);
    // URL is automatically updated by the network store
  }, [setSelectedChain]);

  const handleClaimTokens = useCallback(async () => {
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    if (!isAuthenticated) {
      const { openAuthModal } = useAuthStore.getState();
      openAuthModal();
      return;
    }

    setLoading(true);
    
    try {
      // Use TRPC to claim through backend (which handles rate limiting and DB)
      await claimNativeTRPC.mutateAsync({
        walletAddress: walletAddress,
        chainId: 4202, // Lisk Sepolia
      });
      
      resetForm();
      console.log('Tokens claimed successfully!');
      
    } catch (error) {
      console.error('Failed to claim tokens:', error);
      throw error; // Re-throw for component error handling
    } finally {
      setLoading(false);
    }
  }, [walletAddress, isAuthenticated, setLoading, resetForm, claimNativeTRPC]);

  const canClaim = Boolean(walletAddress && isAuthenticated);

  return {
    handleNetworkChange,
    handleClaimTokens,
    canClaim,
    isClaimPending: claimNativeTRPC.isPending,
    claimError: claimNativeTRPC.error,
    isClaimSuccess: claimNativeTRPC.isSuccess,
  };
};
