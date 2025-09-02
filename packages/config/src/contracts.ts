// Contract addresses configuration for different networks

export interface ContractAddresses {
  devToken: string;
  devNFT: string;
  faucetManager: string;
}

export interface NetworkContracts {
  [network: string]: ContractAddresses;
}

// Contract addresses for different networks
// These will be populated after deployment
export const CONTRACT_ADDRESSES: NetworkContracts = {
  sepolia: {
    devToken: "", // To be filled after deployment
    devNFT: "", // To be filled after deployment
    faucetManager: "", // To be filled after deployment
  },
  amoy: {
    devToken: "", // To be filled after deployment
    devNFT: "", // To be filled after deployment
    faucetManager: "", // To be filled after deployment
  },
  "bsc-testnet": {
    devToken: "", // To be filled after deployment
    devNFT: "", // To be filled after deployment
    faucetManager: "", // To be filled after deployment
  },
  localhost: {
    devToken: "", // To be filled after local deployment
    devNFT: "", // To be filled after local deployment
    faucetManager: "", // To be filled after local deployment
  },
};

// Helper function to get contract addresses for a network
export function getContractAddresses(network: string): ContractAddresses {
  const addresses = CONTRACT_ADDRESSES[network];
  if (!addresses) {
    throw new Error(`No contract addresses found for network: ${network}`);
  }
  return addresses;
}

// Helper function to update contract addresses
export function updateContractAddresses(
  network: string,
  addresses: Partial<ContractAddresses>
): void {
  if (!CONTRACT_ADDRESSES[network]) {
    CONTRACT_ADDRESSES[network] = {
      devToken: "",
      devNFT: "",
      faucetManager: "",
    };
  }
  
  CONTRACT_ADDRESSES[network] = {
    ...CONTRACT_ADDRESSES[network],
    ...addresses,
  };
}

// Contract verification URLs
export const VERIFICATION_URLS = {
  sepolia: "https://sepolia.etherscan.io/verifyContract",
  amoy: "https://www.oklink.com/amoy/contract/verify",
  "bsc-testnet": "https://testnet.bscscan.com/verifyContract",
};

// Contract deployment configuration
export const DEPLOYMENT_CONFIG = {
  gasLimit: 5000000,
  gasPrice: "auto",
  confirmations: 1,
  timeout: 300000, // 5 minutes
};

// Contract constructor arguments
export const CONSTRUCTOR_ARGS = {
  devToken: {
    name: "DevToken",
    symbol: "DEV",
  },
  devNFT: {
    name: "DevNFT",
    symbol: "DNFT",
    baseTokenURI: "https://api.example.com/nft/",
  },
  faucetManager: {
    // No constructor arguments needed
  },
};

// Contract verification constructor arguments (encoded)
export const VERIFICATION_ARGS = {
  devToken: "00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000008446576546f6b656e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003444556000000000000000000000000000000000000000000000000000000000000",
  devNFT: "00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000054465764e465400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000444e46540000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001868747470733a2f2f6170692e6578616d706c652e636f6d2f6e66742f000000",
  faucetManager: "", // No constructor arguments
};

