/**
 * Static chain configuration for the faucet
 * This replaces database chain lookups for now
 */

export interface ChainConfig {
  id: string;
  name: string;
  chainId: number;
  nativeSymbol: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  isActive: boolean;
}

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  // Ethereum Sepolia
  11155111: {
    id: 'sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    nativeSymbol: 'ETH',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isActive: true,
  },
  
  // Lisk Sepolia
  4202: {
    id: 'lisk-sepolia',
    name: 'Lisk Sepolia',
    chainId: 4202,
    nativeSymbol: 'ETH',
    rpcUrl: 'https://rpc.sepolia-api.lisk.com',
    blockExplorerUrl: 'https://sepolia-blockscout.lisk.com',
    isActive: true,
  },
  
  // Polygon Amoy
  80002: {
    id: 'polygon-amoy',
    name: 'Polygon Amoy',
    chainId: 80002,
    nativeSymbol: 'MATIC',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    blockExplorerUrl: 'https://amoy.polygonscan.com',
    isActive: true,
  },
  
  // BSC Testnet
  97: {
    id: 'bsc-testnet',
    name: 'BSC Testnet',
    chainId: 97,
    nativeSymbol: 'tBNB',
    rpcUrl: 'https://bsc-testnet.public.blastapi.io',
    blockExplorerUrl: 'https://testnet.bscscan.com',
    isActive: true,
  },
};

/**
 * Get chain configuration by chain ID
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return SUPPORTED_CHAINS[chainId];
}

/**
 * Check if a chain is supported and active
 */
export function isChainSupported(chainId: number): boolean {
  const chain = SUPPORTED_CHAINS[chainId];
  return chain ? chain.isActive : false;
}

/**
 * Get all active chains
 */
export function getActiveChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter(chain => chain.isActive);
}