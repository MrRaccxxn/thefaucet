import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNetworkStore, useFormStore, useAuthStore } from '../index';
import { Chain } from '../types';
import { api } from '../../trpc/client';
import { getNumericChainId } from '../constants';

/**
 * Compound hook that provides high-level faucet actions
 * Combines multiple stores for complex operations
 */
export const useFaucetActions = (): {
  handleNetworkChange: (chain: Chain) => void;
  handleClaimTokens: () => Promise<any>;
  canClaim: boolean;
  isClaimPending: boolean;
  claimError: any;
  isClaimSuccess: boolean;
  claimData: any;
} => {
  const router = useRouter();
  const { setSelectedChain, selectedChain } = useNetworkStore();
  const { walletAddress, redeemCode, resetForm } = useFormStore();
  const { isAuthenticated, setLoading } = useAuthStore();
  const claimNativeTRPC = api.claim.claimNative.useMutation();

  const handleNetworkChange = useCallback((chain: Chain) => {
    setSelectedChain(chain);
    // URL is automatically updated by the network store
  }, [setSelectedChain]);

  const handleClaimTokens = useCallback(async () => {
    if (!walletAddress) {
      return; // Don't throw, just return early
    }

    if (!isAuthenticated) {
      const { openAuthModal } = useAuthStore.getState();
      openAuthModal();
      return;
    }

    // Get the numeric chain ID from the selected chain
    const numericChainId = getNumericChainId(selectedChain.id);
    console.log('[DEBUG Frontend] Selected chain:', selectedChain.id, '-> Numeric ID:', numericChainId);
    
    if (!numericChainId) {
      console.error(`Unsupported chain: ${selectedChain.id}`);
      return; // Don't throw, TRPC will handle errors
    }

    setLoading(true);
    
    try {
      console.log('[DEBUG Frontend] Sending claim request with chainId:', numericChainId, 'wallet:', walletAddress);
      
      // Use TRPC to claim through backend (which handles rate limiting and DB)
      const result = await claimNativeTRPC.mutateAsync({
        walletAddress: walletAddress,
        chainId: numericChainId, // Use selected chain's numeric ID
      });
      
      resetForm();
      console.log('Tokens claimed successfully!');
      return result;
      
    } catch (error) {
      console.error('Failed to claim tokens:', error);
      // Don't re-throw - let TRPC handle the error state
      // The error will be available in claimNativeTRPC.error
    } finally {
      setLoading(false);
    }
  }, [walletAddress, isAuthenticated, setLoading, resetForm, claimNativeTRPC, selectedChain]);

  const canClaim = Boolean(walletAddress && isAuthenticated);

  return {
    handleNetworkChange,
    handleClaimTokens,
    canClaim,
    isClaimPending: claimNativeTRPC.isPending,
    claimError: claimNativeTRPC.error,
    isClaimSuccess: claimNativeTRPC.isSuccess,
    claimData: claimNativeTRPC.data,
  };
};
