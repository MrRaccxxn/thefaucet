// JavaScript integration example for Faucet contracts
// This example shows how to interact with the faucet contracts using ethers.js

const { ethers } = require('ethers');

// Contract ABIs (simplified for example)
const FAUCET_MANAGER_ABI = [
  "function distributeNativeToken(address payable recipient) external",
  "function distributeToken(address recipient, address tokenAddress, uint256 amount) external",
  "function mintNFT(address recipient, address nftContract) external",
  "function getRemainingCooldown(address user, string assetType, address tokenAddress) external view returns (uint256)",
  "function canClaim(address user, string assetType, address tokenAddress) external view returns (bool)",
  "event NativeTokenDistributed(address indexed recipient, uint256 amount, uint256 timestamp)",
  "event TokenDistributed(address indexed recipient, address indexed token, uint256 amount, uint256 timestamp)",
  "event NFTMinted(address indexed recipient, address indexed nftContract, uint256 tokenId, uint256 timestamp)"
];

const DEV_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "event TokensMinted(address indexed to, uint256 amount)"
];

const DEV_NFT_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function mint(address to) external returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI)"
];

class FaucetIntegration {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
    this.faucetManager = null;
    this.devToken = null;
    this.devNFT = null;
  }

  // Initialize contracts with addresses
  async initializeContracts(faucetManagerAddress, devTokenAddress, devNFTAddress) {
    this.faucetManager = new ethers.Contract(
      faucetManagerAddress,
      FAUCET_MANAGER_ABI,
      this.signer
    );

    this.devToken = new ethers.Contract(
      devTokenAddress,
      DEV_TOKEN_ABI,
      this.signer
    );

    this.devNFT = new ethers.Contract(
      devNFTAddress,
      DEV_NFT_ABI,
      this.signer
    );

    console.log('Contracts initialized successfully');
  }

  // Check if user can claim native tokens
  async canClaimNativeTokens(userAddress) {
    if (!this.faucetManager) throw new Error('FaucetManager not initialized');
    
    return await this.faucetManager.canClaim(
      userAddress,
      "native",
      ethers.ZeroAddress
    );
  }

  // Check if user can claim ERC20 tokens
  async canClaimTokens(userAddress) {
    if (!this.faucetManager || !this.devToken) {
      throw new Error('Contracts not initialized');
    }
    
    return await this.faucetManager.canClaim(
      userAddress,
      "token",
      this.devToken.target
    );
  }

  // Check if user can claim NFTs
  async canClaimNFTs(userAddress) {
    if (!this.faucetManager || !this.devNFT) {
      throw new Error('Contracts not initialized');
    }
    
    return await this.faucetManager.canClaim(
      userAddress,
      "nft",
      this.devNFT.target
    );
  }

  // Get remaining cooldown for native tokens
  async getNativeTokenCooldown(userAddress) {
    if (!this.faucetManager) throw new Error('FaucetManager not initialized');
    
    const remaining = await this.faucetManager.getRemainingCooldown(
      userAddress,
      "native",
      ethers.ZeroAddress
    );
    
    return ethers.formatUnits(remaining, 0); // Convert from seconds
  }

  // Get remaining cooldown for ERC20 tokens
  async getTokenCooldown(userAddress) {
    if (!this.faucetManager || !this.devToken) {
      throw new Error('Contracts not initialized');
    }
    
    const remaining = await this.faucetManager.getRemainingCooldown(
      userAddress,
      "token",
      this.devToken.target
    );
    
    return ethers.formatUnits(remaining, 0); // Convert from seconds
  }

  // Get remaining cooldown for NFTs
  async getNFTCooldown(userAddress) {
    if (!this.faucetManager || !this.devNFT) {
      throw new Error('Contracts not initialized');
    }
    
    const remaining = await this.faucetManager.getRemainingCooldown(
      userAddress,
      "nft",
      this.devNFT.target
    );
    
    return ethers.formatUnits(remaining, 0); // Convert from seconds
  }

  // Claim native tokens
  async claimNativeTokens(recipientAddress) {
    if (!this.faucetManager) throw new Error('FaucetManager not initialized');
    
    const canClaim = await this.canClaimNativeTokens(recipientAddress);
    if (!canClaim) {
      throw new Error('Cannot claim native tokens yet');
    }

    const tx = await this.faucetManager.distributeNativeToken(recipientAddress);
    const receipt = await tx.wait();
    
    // Find the NativeTokenDistributed event
    const event = receipt.logs.find(log => {
      try {
        const parsed = this.faucetManager.interface.parseLog(log);
        return parsed.name === 'NativeTokenDistributed';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = this.faucetManager.interface.parseLog(event);
      console.log(`Native tokens distributed: ${ethers.formatEther(parsed.args.amount)} ETH`);
    }

    return receipt;
  }

  // Claim ERC20 tokens
  async claimTokens(recipientAddress, amount) {
    if (!this.faucetManager || !this.devToken) {
      throw new Error('Contracts not initialized');
    }
    
    const canClaim = await this.canClaimTokens(recipientAddress);
    if (!canClaim) {
      throw new Error('Cannot claim tokens yet');
    }

    const tx = await this.faucetManager.distributeToken(
      recipientAddress,
      this.devToken.target,
      amount
    );
    const receipt = await tx.wait();
    
    // Find the TokenDistributed event
    const event = receipt.logs.find(log => {
      try {
        const parsed = this.faucetManager.interface.parseLog(log);
        return parsed.name === 'TokenDistributed';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = this.faucetManager.interface.parseLog(event);
      console.log(`Tokens distributed: ${ethers.formatUnits(parsed.args.amount, 18)} DEV`);
    }

    return receipt;
  }

  // Claim NFT
  async claimNFT(recipientAddress) {
    if (!this.faucetManager || !this.devNFT) {
      throw new Error('Contracts not initialized');
    }
    
    const canClaim = await this.canClaimNFTs(recipientAddress);
    if (!canClaim) {
      throw new Error('Cannot claim NFT yet');
    }

    const tx = await this.faucetManager.mintNFT(
      recipientAddress,
      this.devNFT.target
    );
    const receipt = await tx.wait();
    
    // Find the NFTMinted event
    const event = receipt.logs.find(log => {
      try {
        const parsed = this.faucetManager.interface.parseLog(log);
        return parsed.name === 'NFTMinted';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = this.faucetManager.interface.parseLog(event);
      console.log(`NFT minted: Token ID ${parsed.args.tokenId.toString()}`);
    }

    return receipt;
  }

  // Get user's token balance
  async getTokenBalance(userAddress) {
    if (!this.devToken) throw new Error('DevToken not initialized');
    
    const balance = await this.devToken.balanceOf(userAddress);
    return ethers.formatUnits(balance, 18);
  }

  // Get user's NFT balance
  async getNFTBalance(userAddress) {
    if (!this.devNFT) throw new Error('DevNFT not initialized');
    
    const balance = await this.devNFT.balanceOf(userAddress);
    return balance.toString();
  }

  // Get total token supply
  async getTotalTokenSupply() {
    if (!this.devToken) throw new Error('DevToken not initialized');
    
    const supply = await this.devToken.totalSupply();
    return ethers.formatUnits(supply, 18);
  }

  // Get total NFT supply
  async getTotalNFTSupply() {
    if (!this.devNFT) throw new Error('DevNFT not initialized');
    
    const supply = await this.devNFT.totalSupply();
    return supply.toString();
  }

  // Listen to events
  listenToEvents() {
    if (!this.faucetManager) throw new Error('FaucetManager not initialized');

    // Listen to native token distributions
    this.faucetManager.on('NativeTokenDistributed', (recipient, amount, timestamp) => {
      console.log(`Native tokens distributed to ${recipient}: ${ethers.formatEther(amount)} ETH at ${new Date(Number(timestamp) * 1000)}`);
    });

    // Listen to token distributions
    this.faucetManager.on('TokenDistributed', (recipient, token, amount, timestamp) => {
      console.log(`Tokens distributed to ${recipient}: ${ethers.formatUnits(amount, 18)} tokens at ${new Date(Number(timestamp) * 1000)}`);
    });

    // Listen to NFT mints
    this.faucetManager.on('NFTMinted', (recipient, nftContract, tokenId, timestamp) => {
      console.log(`NFT minted to ${recipient}: Token ID ${tokenId.toString()} at ${new Date(Number(timestamp) * 1000)}`);
    });
  }

  // Stop listening to events
  stopListening() {
    if (this.faucetManager) {
      this.faucetManager.removeAllListeners();
    }
  }
}

// Example usage
async function example() {
  // Connect to provider (replace with your RPC URL)
  const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_PROJECT_ID');
  
  // Connect with private key (replace with your private key)
  const privateKey = '0x...'; // Your private key
  const signer = new ethers.Wallet(privateKey, provider);

  // Contract addresses (replace with actual deployed addresses)
  const faucetManagerAddress = '0x...';
  const devTokenAddress = '0x...';
  const devNFTAddress = '0x...';

  // Initialize integration
  const faucet = new FaucetIntegration(provider, signer);
  await faucet.initializeContracts(faucetManagerAddress, devTokenAddress, devNFTAddress);

  const userAddress = await signer.getAddress();

  try {
    // Check if user can claim
    const canClaimNative = await faucet.canClaimNativeTokens(userAddress);
    const canClaimTokens = await faucet.canClaimTokens(userAddress);
    const canClaimNFTs = await faucet.canClaimNFTs(userAddress);

    console.log('Can claim native tokens:', canClaimNative);
    console.log('Can claim tokens:', canClaimTokens);
    console.log('Can claim NFTs:', canClaimNFTs);

    // Get cooldowns
    const nativeCooldown = await faucet.getNativeTokenCooldown(userAddress);
    const tokenCooldown = await faucet.getTokenCooldown(userAddress);
    const nftCooldown = await faucet.getNFTCooldown(userAddress);

    console.log('Native token cooldown remaining:', nativeCooldown, 'seconds');
    console.log('Token cooldown remaining:', tokenCooldown, 'seconds');
    console.log('NFT cooldown remaining:', nftCooldown, 'seconds');

    // Claim if possible
    if (canClaimNative) {
      await faucet.claimNativeTokens(userAddress);
    }

    if (canClaimTokens) {
      const amount = ethers.parseUnits('100', 18); // 100 tokens
      await faucet.claimTokens(userAddress, amount);
    }

    if (canClaimNFTs) {
      await faucet.claimNFT(userAddress);
    }

    // Get balances
    const tokenBalance = await faucet.getTokenBalance(userAddress);
    const nftBalance = await faucet.getNFTBalance(userAddress);

    console.log('Token balance:', tokenBalance);
    console.log('NFT balance:', nftBalance);

    // Listen to events
    faucet.listenToEvents();

  } catch (error) {
    console.error('Error:', error.message);
  }
}

module.exports = { FaucetIntegration };

