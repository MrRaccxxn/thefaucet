// Collection of NFT images for testnets
// These are placeholder images representing different types of developer NFTs

export const NFT_COLLECTION_IMAGES = [
  {
    id: 1,
    name: "Code Wizard",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=wizard&backgroundColor=6366f1",
    description: "Master of the blockchain code"
  },
  {
    id: 2,
    name: "Bug Hunter",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=hunter&backgroundColor=10b981",
    description: "Expert at finding and fixing bugs"
  },
  {
    id: 3,
    name: "Gas Optimizer",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=optimizer&backgroundColor=f59e0b",
    description: "Efficiency expert in smart contracts"
  },
  {
    id: 4,
    name: "DeFi Builder",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=defi&backgroundColor=ec4899",
    description: "Architect of decentralized finance"
  },
  {
    id: 5,
    name: "Web3 Pioneer",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=pioneer&backgroundColor=8b5cf6",
    description: "Early adopter and innovator"
  }
];

// Get a random NFT image for display
export function getRandomNFTImage() {
  const randomIndex = Math.floor(Math.random() * NFT_COLLECTION_IMAGES.length);
  return NFT_COLLECTION_IMAGES[randomIndex];
}

// Get NFT image by token ID (deterministic based on ID)
export function getNFTImageByTokenId(tokenId: number) {
  const index = tokenId % NFT_COLLECTION_IMAGES.length;
  return NFT_COLLECTION_IMAGES[index];
}

// Generate metadata for NFT
export function generateNFTMetadata(tokenId: number, walletAddress: string) {
  const nft = getNFTImageByTokenId(tokenId);
  
  return {
    name: `${nft?.name ?? 'Developer NFT'} #${tokenId}`,
    description: nft?.description ?? 'A unique developer NFT',
    image: nft?.image ?? '/default-nft.png',
    external_url: `https://thefaucet.dev/nft/${tokenId}`,
    attributes: [
      {
        trait_type: "Type",
        value: nft?.name ?? 'Developer NFT'
      },
      {
        trait_type: "Token ID",
        value: tokenId
      },
      {
        trait_type: "Minted By",
        value: walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
      },
      {
        trait_type: "Network",
        value: "Testnet"
      },
      {
        trait_type: "Rarity",
        value: "Common"
      }
    ]
  };
}