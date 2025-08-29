import { create } from 'zustand';
import { AppStore } from './types';

// App-wide state that doesn't need persistence
export const useAppStore = create<AppStore>()((set) => ({
  isInitialized: false,

  setInitialized: (initialized: boolean) => {
    set({ isInitialized: initialized });
  },
}));
