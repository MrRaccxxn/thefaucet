import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeStore, Theme } from './types';
import { DEFAULT_THEME, STORAGE_KEYS } from './constants';
import { applyTheme } from './utils';

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: DEFAULT_THEME,

      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: STORAGE_KEYS.THEME,
      onRehydrateStorage: () => (state) => {
        // Apply theme immediately after hydration
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    }
  )
);
