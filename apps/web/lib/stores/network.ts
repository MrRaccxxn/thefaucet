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
