import { defineChain } from 'viem';

export const liskSepolia = defineChain({
  id: 4202,
  name: 'Lisk Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia-api.lisk.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Lisk Sepolia Explorer',
      url: 'https://sepolia-blockscout.lisk.com',
    },
  },
  testnet: true,
});

export const SUPPORTED_CHAINS = {
  'sepolia': {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: (alchemyApiKey: string) => `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`,
    explorer: 'https://sepolia.etherscan.io',
  },
  'lisk-sepolia': {
    id: 4202,
    name: 'Lisk Sepolia',
    rpcUrl: () => 'https://rpc.sepolia-api.lisk.com',
    explorer: 'https://sepolia-blockscout.lisk.com',
  },
  'amoy': {
    id: 80002,
    name: 'Polygon Amoy',
    rpcUrl: (alchemyApiKey: string) => `https://polygon-amoy.g.alchemy.com/v2/${alchemyApiKey}`,
    explorer: 'https://www.oklink.com/amoy',
  },
  'bsc-testnet': {
    id: 97,
    name: 'BSC Testnet',
    rpcUrl: (alchemyApiKey: string) => `https://bsc-testnet.g.alchemy.com/v2/${alchemyApiKey}`,
    explorer: 'https://testnet.bscscan.com',
  },
} as const;

export type SupportedChainName = keyof typeof SUPPORTED_CHAINS;

