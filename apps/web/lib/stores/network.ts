import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NetworkStore, Chain } from './types';
import { CHAINS, DEFAULT_CHAIN, STORAGE_KEYS } from './constants';

export const useNetworkStore = create<NetworkStore>()(
  persist(
    (set, get) => ({
      chains: CHAINS,
      selectedChain: DEFAULT_CHAIN!,

      setSelectedChain: (chain: Chain) => {
        const currentChain = get().selectedChain;
        if (currentChain.id === chain.id) return; // Prevent unnecessary updates
        
        set({ selectedChain: chain });
        
        // Update URL parameter when chain changes from user interaction
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('chain', chain.slug);
          window.history.replaceState({}, '', url.toString());
        }
      },

      setSelectedChainWithoutUrl: (chain: Chain) => {
        const currentChain = get().selectedChain;
        if (currentChain.id === chain.id) return; // Prevent unnecessary updates
        set({ selectedChain: chain });
      },

      getChainBySlug: (slug: string) => {
        return get().chains.find(chain => chain.slug === slug);
      },
    }),
    {
      name: STORAGE_KEYS.SELECTED_CHAIN,
      // Only persist the selected chain ID to avoid data duplication
      partialize: (state) => ({ 
        selectedChain: state.selectedChain 
      }),
    }
  )
);
