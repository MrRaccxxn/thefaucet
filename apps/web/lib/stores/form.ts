import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FormStore } from './types';
import { STORAGE_KEYS } from './constants';

export const useFormStore = create<FormStore>()(
  persist(
    (set) => ({
      walletAddress: '',
      redeemCode: '',
      showRedeemCode: false,

      setWalletAddress: (address: string) => {
        set({ walletAddress: address });
      },

      setRedeemCode: (code: string) => {
        set({ redeemCode: code });
      },

      setShowRedeemCode: (show: boolean) => {
        set({ showRedeemCode: show });
      },

      resetForm: () => {
        set({ 
          walletAddress: '', 
          redeemCode: '', 
          showRedeemCode: false 
        });
      },
    }),
    {
      name: STORAGE_KEYS.WALLET_ADDRESS,
      // Only persist wallet address for convenience
      partialize: (state) => ({ 
        walletAddress: state.walletAddress 
      }),
    }
  )
);
