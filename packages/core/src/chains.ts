/**
 * Chain Configuration (following chainlist.org standard)
 *
 * Static configuration for supported blockchain networks.
 * Compatible with https://chainlist.org format.
 */

export interface ChainConfig {
  /** Human readable name */
  name: string;
  /** Chain identifier (e.g., "ETH", "MATIC") */
  chain: string;
  /** RPC endpoint URLs */
  rpc: string[];
  /** Faucet URLs (empty for mainnet) */
  faucets: string[];
  /** Native currency information */
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** Chain features (EIP support) */
  features?: Array<{ name: string }>;
  /** Information URL */
  infoURL: string;
  /** Short name for URLs and identifiers */
  shortName: string;
  /** Chain ID (EIP-155) */
  chainId: number;
  /** Network ID */
  networkId: number;
  /** Icon identifier */
  icon?: string;
  /** Block explorers */
  explorers: Array<{
    name: string;
    url: string;
    icon?: string;
    standard: string;
    apiUrl?: string;
  }>;
  /** Additional faucet configuration */
  faucetConfig?: {
    /** Alchemy network name (if supported) */
    alchemy?: string;
    /** Testnet flag */
    isTestnet: boolean;
  };
}

/**
 * Supported chain configurations
 */
export const CHAINS: Record<string, ChainConfig> = {
  sepolia: {
    name: "Ethereum Sepolia",
    chain: "ETH",
    rpc: ["https://ethereum-sepolia.publicnode.com", "https://rpc.sepolia.org"],
    faucets: ["https://faucet.sepolia.dev/", "https://sepoliafaucet.com/"],
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "SEP",
      decimals: 18,
    },
    features: [{ name: "EIP155" }, { name: "EIP1559" }],
    infoURL: "https://sepolia.otterscan.io",
    shortName: "sepolia",
    chainId: 11155111,
    networkId: 11155111,
    icon: "ethereum",
    explorers: [
      {
        name: "etherscan",
        url: "https://sepolia.etherscan.io",
        icon: "etherscan",
        standard: "EIP3091",
        apiUrl: "https://api-sepolia.etherscan.io/api",
      },
    ],
    faucetConfig: {
      alchemy: "eth-sepolia",
      isTestnet: true,
    },
  },

  amoy: {
    name: "Polygon Amoy",
    chain: "MATIC",
    rpc: [
      "https://rpc-amoy.polygon.technology",
      "https://polygon-amoy.drpc.org",
      "https://polygon-amoy-bor.publicnode.com",
    ],
    faucets: ["https://faucet.polygon.technology/"],
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    features: [{ name: "EIP155" }, { name: "EIP1559" }],
    infoURL: "https://polygon.technology/",
    shortName: "amoy",
    chainId: 80002,
    networkId: 80002,
    icon: "polygon",
    explorers: [
      {
        name: "polygonscan",
        url: "https://amoy.polygonscan.com",
        icon: "polygonscan",
        standard: "EIP3091",
        apiUrl: "https://api-amoy.polygonscan.com/api",
      },
    ],
    faucetConfig: {
      alchemy: "polygon-amoy",
      isTestnet: true,
    },
  },

  bscTestnet: {
    name: "BSC Testnet",
    chain: "BSC",
    rpc: [
      "https://bsc-testnet.public.blastapi.io",
      "https://data-seed-prebsc-1-s1.binance.org:8545",
      "https://bsc-testnet.publicnode.com",
    ],
    faucets: ["https://testnet.bnbchain.org/faucet-smart"],
    nativeCurrency: {
      name: "Binance Chain Native Token",
      symbol: "tBNB",
      decimals: 18,
    },
    features: [{ name: "EIP155" }, { name: "EIP1559" }],
    infoURL: "https://www.bnbchain.org/en",
    shortName: "bsc-testnet",
    chainId: 97,
    networkId: 97,
    icon: "binance",
    explorers: [
      {
        name: "bscscan",
        url: "https://testnet.bscscan.com",
        icon: "bscscan",
        standard: "EIP3091",
        apiUrl: "https://api-testnet.bscscan.com/api",
      },
    ],
    faucetConfig: {
      isTestnet: true,
    },
  },

  liskSepolia: {
    name: "Lisk Sepolia",
    chain: "ETH",
    rpc: ["https://rpc.sepolia-api.lisk.com"],
    faucets: [],
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    features: [{ name: "EIP155" }, { name: "EIP1559" }],
    infoURL: "https://docs.lisk.com",
    shortName: "lisk-sepolia",
    chainId: 4202,
    networkId: 4202,
    icon: "lisk",
    explorers: [
      {
        name: "Lisk Sepolia Explorer",
        url: "https://sepolia-blockscout.lisk.com",
        icon: "blockscout",
        standard: "EIP3091",
      },
    ],
    faucetConfig: {
      isTestnet: true,
    },
  },
} as const;

/**
 * Get chain configuration by chain ID
 */
export function getChainById(chainId: number): ChainConfig | undefined {
  return Object.values(CHAINS).find((chain) => chain.chainId === chainId);
}

/**
 * Get chain configuration by slug
 */
export function getChainBySlug(slug: string): ChainConfig | undefined {
  return CHAINS[slug];
}

/**
 * Get all testnet chains
 */
export function getTestnetChains(): ChainConfig[] {
  return Object.values(CHAINS).filter((chain) => chain.faucetConfig?.isTestnet);
}

/**
 * Get all mainnet chains
 */
export function getMainnetChains(): ChainConfig[] {
  return Object.values(CHAINS).filter(
    (chain) => !chain.faucetConfig?.isTestnet
  );
}

/**
 * Build Alchemy RPC URL for a chain
 */
export function getAlchemyRpcUrl(
  chain: ChainConfig,
  apiKey: string
): string | null {
  if (!chain.faucetConfig?.alchemy) return null;
  return `https://${chain.faucetConfig.alchemy}.g.alchemy.com/v2/${apiKey}`;
}

/**
 * Get the best available RPC URL for a chain
 */
export function getRpcUrl(chain: ChainConfig, alchemyApiKey?: string): string {
  // Try Alchemy first if available and API key provided
  if (alchemyApiKey && chain.faucetConfig?.alchemy) {
    const alchemyUrl = getAlchemyRpcUrl(chain, alchemyApiKey);
    if (alchemyUrl) return alchemyUrl;
  }

  // Fallback to first public RPC
  const firstPublicRpc = chain.rpc[0];
  if (!firstPublicRpc) {
    throw new Error(`No RPC URLs configured for chain ${chain.name}`);
  }
  return firstPublicRpc;
}
