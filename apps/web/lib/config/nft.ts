export const NFT_CONFIG = {
  // IPFS gateway URL for NFT metadata
  IPFS_BASE_URL:
    "https://jade-radical-tick-245.mypinata.cloud/ipfs/QmShYUhLFWLcSoqpaa18evzqLTWtzfkLVQzbZRbbKGDAzV/",

  // IPFS gateway base (for converting ipfs:// URLs)
  IPFS_GATEWAY: "https://jade-radical-tick-245.mypinata.cloud/ipfs/",

  // Range of NFT IDs to use for random selection (skipping first 10 burned ones)
  MIN_NFT_ID: 11,
  MAX_NFT_ID: 100,

  // Default fallback NFT image
  DEFAULT_NFT_IMAGE: "https://placehold.co/500x500?text=NFT",

  // Chain ID to network name mapping
  CHAIN_NAMES: {
    11155111: "sepolia",
    4202: "lisk-sepolia",
    80002: "amoy",
    97: "bsc-testnet",
  } as Record<number, string>,
} as const;
