// Core types for our state management
export interface Chain {
  id: string;
  name: string;
  color: string;
  amount: string;
  slug: string;
}

export interface User {
  id: string;
  nickname: string;
  avatarUrl?: string;
  isVerified: boolean;
}

export interface ClaimRequest {
  chainId: string;
  walletAddress: string;
  redeemCode?: string;
  amount: string;
}

export interface ClaimHistory {
  id: string;
  chainId: string;
  walletAddress: string;
  amount: string;
  txHash?: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
}

// Theme types
export type Theme = 'light' | 'dark';

// Store interfaces
export interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export interface NetworkStore {
  chains: Chain[];
  selectedChain: Chain;
  setSelectedChain: (chain: Chain) => void;
  setSelectedChainWithoutUrl: (chain: Chain) => void;
  getChainBySlug: (slug: string) => Chain | undefined;
}

export interface FormStore {
  walletAddress: string;
  redeemCode: string;
  showRedeemCode: boolean;
  setWalletAddress: (address: string) => void;
  setRedeemCode: (code: string) => void;
  setShowRedeemCode: (show: boolean) => void;
  resetForm: () => void;
}

export interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  showAuthModal: boolean;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export interface AppStore {
  isInitialized: boolean;
  setInitialized: (initialized: boolean) => void;
}
