// Contract type definitions

export interface ContractConfig {
  address: string;
  chainId: number;
}

export interface FaucetManagerConfig extends ContractConfig {
  // Placeholder - will be defined with actual contract interface
}

export interface DevTokenConfig extends ContractConfig {
  symbol: string;
  decimals: number;
}

export interface DevNFTConfig extends ContractConfig {
  name: string;
  symbol: string;
}

