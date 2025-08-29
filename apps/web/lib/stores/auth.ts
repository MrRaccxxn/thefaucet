import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthStore, User } from './types';
import { STORAGE_KEYS } from './constants';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      showAuthModal: false,

      login: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false,
          showAuthModal: false
        });
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          showAuthModal: false
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      openAuthModal: () => {
        set({ showAuthModal: true });
      },

      closeAuthModal: () => {
        set({ showAuthModal: false });
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      // Persist user and auth status
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
