import { Chain } from './types';

// Available chains configuration
export const CHAINS: Chain[] = [
  { 
    id: 'ethereum', 
    name: 'Ethereum Sepolia', 
    color: 'bg-blue-500', 
    amount: '0.02 ETH', 
    slug: 'ethereum-sepolia',
    blockExplorerUrl: 'https://sepolia.etherscan.io'
  },
  { 
    id: 'polygon', 
    name: 'Polygon Amoy', 
    color: 'bg-purple-500', 
    amount: '0.02 MATIC', 
    slug: 'polygon-amoy',
    blockExplorerUrl: 'https://amoy.polygonscan.com'
  },
  { 
    id: 'bsc', 
    name: 'BSC Testnet', 
    color: 'bg-yellow-500', 
    amount: '0.02 BNB', 
    slug: 'bsc-testnet',
    blockExplorerUrl: 'https://testnet.bscscan.com'
  },
  { 
    id: 'lisk', 
    name: 'Lisk Sepolia', 
    color: 'bg-green-500', 
    amount: '0.02 ETH', 
    slug: 'lisk-sepolia',
    blockExplorerUrl: 'https://sepolia-blockscout.lisk.com'
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

// Chain ID mapping from frontend IDs to backend numeric chain IDs
export const CHAIN_ID_MAPPING: Record<string, number> = {
  'ethereum': 11155111, // Ethereum Sepolia
  'polygon': 80002,     // Polygon Amoy
  'bsc': 97,            // BSC Testnet
  'lisk': 4202,         // Lisk Sepolia
} as const;

// Helper function to get numeric chain ID from frontend chain ID
export function getNumericChainId(frontendChainId: string): number | null {
  return CHAIN_ID_MAPPING[frontendChainId] || null;
}

// Theme constants
export const DEFAULT_THEME = 'dark' as const;
