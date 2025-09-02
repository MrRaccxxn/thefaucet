// TypeScript type definitions for smart contracts

export interface FaucetManagerEvents {
  NativeTokenDistributed: {
    recipient: string;
    amount: bigint;
    timestamp: bigint;
  };
  TokenDistributed: {
    recipient: string;
    token: string;
    amount: bigint;
    timestamp: bigint;
  };
  NFTMinted: {
    recipient: string;
    nftContract: string;
    tokenId: bigint;
    timestamp: bigint;
  };
  CooldownUpdated: {
    assetType: string;
    newCooldown: bigint;
  };
  AmountUpdated: {
    assetType: string;
    newAmount: bigint;
  };
  AddressWhitelisted: {
    addr: string;
    whitelisted: boolean;
  };
  AddressBlacklistedEvent: {
    addr: string;
    blacklisted: boolean;
  };
  EmergencyWithdrawal: {
    recipient: string;
    amount: bigint;
  };
}

export interface DevTokenEvents {
  TokensMinted: {
    to: string;
    amount: bigint;
  };
  TokensBurned: {
    from: string;
    amount: bigint;
  };
  MaxSupplyUpdated: {
    oldMaxSupply: bigint;
    newMaxSupply: bigint;
  };
  Transfer: {
    from: string;
    to: string;
    value: bigint;
  };
  Approval: {
    owner: string;
    spender: string;
    value: bigint;
  };
}

export interface DevNFTEvents {
  NFTMinted: {
    to: string;
    tokenId: bigint;
    tokenURI: string;
  };
  BaseURIUpdated: {
    oldBaseURI: string;
    newBaseURI: string;
  };
  Transfer: {
    from: string;
    to: string;
    tokenId: bigint;
  };
  Approval: {
    owner: string;
    approved: string;
    tokenId: bigint;
  };
  ApprovalForAll: {
    owner: string;
    operator: string;
    approved: boolean;
  };
}

// Contract configuration types
export interface FaucetConfig {
  nativeTokenCooldown: bigint;
  tokenCooldown: bigint;
  nftCooldown: bigint;
  nativeTokenAmount: bigint;
  defaultTokenAmount: bigint;
  maxNFTsPerUser: bigint;
}

export interface TokenConfig {
  name: string;
  symbol: string;
  initialSupply: bigint;
  maxSupply: bigint;
}

export interface NFTConfig {
  name: string;
  symbol: string;
  baseTokenURI: string;
  maxSupply: bigint;
}

// Deployment addresses
export interface DeploymentAddresses {
  network: string;
  deployer: string;
  admin: string;
  devToken: string;
  devNFT: string;
  faucetManager: string;
  deploymentTime: string;
}

// Network configuration
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Supported networks
export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  sepolia: {
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: "https://sepolia.infura.io/v3/",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  amoy: {
    name: "Amoy",
    chainId: 80002,
    rpcUrl: "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://www.oklink.com/amoy",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
  },
  "bsc-testnet": {
    name: "BSC Testnet",
    chainId: 97,
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
    blockExplorer: "https://testnet.bscscan.com",
    nativeCurrency: {
      name: "BNB",
      symbol: "tBNB",
      decimals: 18,
    },
  },
};

// Default configuration values
export const DEFAULT_FAUCET_CONFIG: FaucetConfig = {
  nativeTokenCooldown: BigInt(86400), // 1 day (24 hours)
  tokenCooldown: BigInt(86400), // 1 day (24 hours)
  nftCooldown: BigInt(7200), // 2 hours
  nativeTokenAmount: BigInt("50000000000000000"), // 0.05 ETH
  defaultTokenAmount: BigInt("1000000000000000000000"), // 1000 tokens
  maxNFTsPerUser: BigInt(1),
};

export const DEFAULT_TOKEN_CONFIG: TokenConfig = {
  name: "DevToken",
  symbol: "DEV",
  initialSupply: BigInt("1000000000000000000000000"), // 1M tokens
  maxSupply: BigInt("10000000000000000000000000"), // 10M tokens
};

export const DEFAULT_NFT_CONFIG: NFTConfig = {
  name: "DevNFT",
  symbol: "DNFT",
  baseTokenURI: "https://api.example.com/nft/",
  maxSupply: BigInt(10000),
};

// Contract function types
export type FaucetManagerFunction = 
  | "distributeNativeToken"
  | "distributeToken"
  | "mintNFT"
  | "updateCooldown"
  | "updateAmount"
  | "updateNFTLimit"
  | "setAddressStatus"
  | "setPaused"
  | "emergencyWithdraw"
  | "emergencyWithdrawToken"
  | "getRemainingCooldown"
  | "canClaim"
  | "getUserNFTCount"
  | "getNFTBalance";

export type DevTokenFunction = 
  | "mint"
  | "burn"
  | "burnFrom"
  | "pause"
  | "unpause"
  | "getRemainingMintableSupply"
  | "canMint"
  | "transfer"
  | "approve"
  | "transferFrom"
  | "balanceOf"
  | "totalSupply"
  | "allowance";

export type DevNFTFunction = 
  | "mint"
  | "batchMint"
  | "pause"
  | "unpause"
  | "setBaseTokenURI"
  | "totalSupply"
  | "getRemainingMintableSupply"
  | "canMint"
  | "tokenURI"
  | "transfer"
  | "approve"
  | "transferFrom"
  | "balanceOf"
  | "ownerOf";

