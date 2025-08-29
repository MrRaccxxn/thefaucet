import { Chain } from './types';

// Available chains configuration
export const CHAINS: Chain[] = [
  { 
    id: 'ethereum', 
    name: 'Ethereum Sepolia', 
    color: 'bg-blue-500', 
    amount: '0.02 ETH', 
    slug: 'ethereum-sepolia' 
  },
  { 
    id: 'polygon', 
    name: 'Polygon Amoy', 
    color: 'bg-purple-500', 
    amount: '0.02 MATIC', 
    slug: 'polygon-amoy' 
  },
  { 
    id: 'bsc', 
    name: 'BSC Testnet', 
    color: 'bg-yellow-500', 
    amount: '0.02 BNB', 
    slug: 'bsc-testnet' 
  },
  { 
    id: 'lisk', 
    name: 'Lisk Sepolia', 
    color: 'bg-green-500', 
    amount: '0.02 LSK', 
    slug: 'lisk-sepolia' 
  },
];

// Default chain
export const DEFAULT_CHAIN = CHAINS[0];

// Storage keys
export const STORAGE_KEYS = {
  THEME: 'faucet-theme',
  SELECTED_CHAIN: 'faucet-selected-chain',
  WALLET_ADDRESS: 'faucet-wallet-address',
  USER: 'faucet-user',
} as const;

// Theme constants
export const DEFAULT_THEME = 'dark' as const;
