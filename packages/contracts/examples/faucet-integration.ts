// TypeScript integration example for Faucet contracts
// This example shows how to interact with the faucet contracts using ethers.js and TypeScript

import { ethers } from 'ethers';
import type { 
  FaucetManagerEvents, 
  DevTokenEvents, 
  DevNFTEvents,
  FaucetConfig,
  TokenConfig,
  NFTConfig 
} from '../../core/src/types/contracts';

// Import ABIs (these would be imported from the generated ABI files)
import FaucetManagerABI from '../../core/src/abi/FaucetManager.json';
import DevTokenABI from '../../core/src/abi/DevToken.json';
import DevNFTABI from '../../core/src/abi/DevNFT.json';

export class FaucetIntegration {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private faucetManager: ethers.Contract | null = null;
  private devToken: ethers.Contract | null = null;
  private devNFT: ethers.Contract | null = null;

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  // Initialize contracts with addresses
  async initializeContracts(
    faucetManagerAddress: string,
    devTokenAddress: string,
    devNFTAddress: string
  ): Promise<void> {
    this.faucetManager = new ethers.Contract(
      faucetManagerAddress,
      FaucetManagerABI,
      this.signer
    );

    this.devToken = new ethers.Contract(
      devTokenAddress,
      DevTokenABI,
      this.signer
    );

    this.devNFT = new ethers.Contract(
      devNFTAddress,
      DevNFTABI,
      this.signer
    );

    console.log('Contracts initialized successfully');
  }

  // Check if user can claim native tokens
  async canClaimNativeTokens(userAddress: string): Promise<boolean> {
    if (!this.faucetManager) throw new Error('FaucetManager not initialized');
    
    return await this.faucetManager.canClaim(
      userAddress,
      "native",
      ethers.ZeroAddress
    );
  }

  // Check if user can claim ERC20 tokens
  async canClaimTokens(userAddress: string): Promise<boolean> {
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
  async canClaimNFTs(userAddress: string): Promise<boolean> {
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
  async getNativeTokenCooldown(userAddress: string): Promise<number> {
    if (!this.faucetManager) throw new Error('FaucetManager not initialized');
    
    const remaining = await this.faucetManager.getRemainingCooldown(
      userAddress,
      "native",
      ethers.ZeroAddress
    );
    
    return Number(ethers.formatUnits(remaining, 0)); // Convert from seconds
  }

  // Get remaining cooldown for ERC20 tokens
  async getTokenCooldown(userAddress: string): Promise<number> {
    if (!this.faucetManager || !this.devToken) {
      throw new Error('Contracts not initialized');
    }
    
    const remaining = await this.faucetManager.getRemainingCooldown(
      userAddress,
      "token",
      this.devToken.target
    );
    
    return Number(ethers.formatUnits(remaining, 0)); // Convert from seconds
  }

  // Get remaining cooldown for NFTs
  async getNFTCooldown(userAddress: string): Promise<number> {
    if (!this.faucetManager || !this.devNFT) {
      throw new Error('Contracts not initialized');
    }
    
    const remaining = await this.faucetManager.getRemainingCooldown(
      userAddress,
      "nft",
      this.devNFT.target
    );
    
    return Number(ethers.formatUnits(remaining, 0)); // Convert from seconds
  }

  // Claim native tokens
  async claimNativeTokens(recipientAddress: string): Promise<ethers.ContractTransactionReceipt> {
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
        const parsed = this.faucetManager!.interface.parseLog(log);
        return parsed.name === 'NativeTokenDistributed';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = this.faucetManager!.interface.parseLog(event);
      console.log(`Native tokens distributed: ${ethers.formatEther(parsed.args.amount)} ETH`);
    }

    return receipt;
  }

  // Claim ERC20 tokens
  async claimTokens(recipientAddress: string, amount: bigint): Promise<ethers.ContractTransactionReceipt> {
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
        const parsed = this.faucetManager!.interface.parseLog(log);
        return parsed.name === 'TokenDistributed';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = this.faucetManager!.interface.parseLog(event);
      console.log(`Tokens distributed: ${ethers.formatUnits(parsed.args.amount, 18)} DEV`);
    }

    return receipt;
  }

  // Claim NFT
  async claimNFT(recipientAddress: string): Promise<ethers.ContractTransactionReceipt> {
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
        const parsed = this.faucetManager!.interface.parseLog(log);
        return parsed.name === 'NFTMinted';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = this.faucetManager!.interface.parseLog(event);
      console.log(`NFT minted: Token ID ${parsed.args.tokenId.toString()}`);
    }

    return receipt;
  }

  // Get user's token balance
  async getTokenBalance(userAddress: string): Promise<string> {
    if (!this.devToken) throw new Error('DevToken not initialized');
    
    const balance = await this.devToken.balanceOf(userAddress);
    return ethers.formatUnits(balance, 18);
  }

  // Get user's NFT balance
  async getNFTBalance(userAddress: string): Promise<string> {
    if (!this.devNFT) throw new Error('DevNFT not initialized');
    
    const balance = await this.devNFT.balanceOf(userAddress);
    return balance.toString();
  }

  // Get total token supply
  async getTotalTokenSupply(): Promise<string> {
    if (!this.devToken) throw new Error('DevToken not initialized');
    
    const supply = await this.devToken.totalSupply();
    return ethers.formatUnits(supply, 18);
  }

  // Get total NFT supply
  async getTotalNFTSupply(): Promise<string> {
    if (!this.devNFT) throw new Error('DevNFT not initialized');
    
    const supply = await this.devNFT.totalSupply();
    return supply.toString();
  }

  // Get faucet configuration
  async getFaucetConfig(): Promise<FaucetConfig> {
    if (!this.faucetManager) throw new Error('FaucetManager not initialized');
    
    const [
      nativeTokenCooldown,
      tokenCooldown,
      nftCooldown,
      nativeTokenAmount,
      defaultTokenAmount,
      maxNFTsPerUser
    ] = await Promise.all([
      this.faucetManager.nativeTokenCooldown(),
      this.faucetManager.tokenCooldown(),
      this.faucetManager.nftCooldown(),
      this.faucetManager.nativeTokenAmount(),
      this.faucetManager.defaultTokenAmount(),
      this.faucetManager.maxNFTsPerUser()
    ]);

    return {
      nativeTokenCooldown,
      tokenCooldown,
      nftCooldown,
      nativeTokenAmount,
      defaultTokenAmount,
      maxNFTsPerUser
    };
  }

  // Get token configuration
  async getTokenConfig(): Promise<TokenConfig> {
    if (!this.devToken) throw new Error('DevToken not initialized');
    
    const [name, symbol, totalSupply] = await Promise.all([
      this.devToken.name(),
      this.devToken.symbol(),
      this.devToken.totalSupply()
    ]);

    return {
      name,
      symbol,
      initialSupply: totalSupply, // This would need to be tracked separately
      maxSupply: BigInt(10_000_000) * BigInt(10 ** 18) // Hardcoded for now
    };
  }

  // Get NFT configuration
  async getNFTConfig(): Promise<NFTConfig> {
    if (!this.devNFT) throw new Error('DevNFT not initialized');
    
    const [name, symbol, totalSupply, baseTokenURI] = await Promise.all([
      this.devNFT.name(),
      this.devNFT.symbol(),
      this.devNFT.totalSupply(),
      this.devNFT.baseTokenURI()
    ]);

    return {
      name,
      symbol,
      baseTokenURI,
      maxSupply: BigInt(10_000) // Hardcoded for now
    };
  }

  // Listen to events with typed event handlers
  listenToEvents(
    onNativeTokenDistributed?: (event: FaucetManagerEvents['NativeTokenDistributed']) => void,
    onTokenDistributed?: (event: FaucetManagerEvents['TokenDistributed']) => void,
    onNFTMinted?: (event: FaucetManagerEvents['NFTMinted']) => void
  ): void {
    if (!this.faucetManager) throw new Error('FaucetManager not initialized');

    // Listen to native token distributions
    this.faucetManager.on('NativeTokenDistributed', (recipient, amount, timestamp) => {
      const event: FaucetManagerEvents['NativeTokenDistributed'] = {
        recipient,
        amount,
        timestamp
      };
      
      console.log(`Native tokens distributed to ${recipient}: ${ethers.formatEther(amount)} ETH at ${new Date(Number(timestamp) * 1000)}`);
      onNativeTokenDistributed?.(event);
    });

    // Listen to token distributions
    this.faucetManager.on('TokenDistributed', (recipient, token, amount, timestamp) => {
      const event: FaucetManagerEvents['TokenDistributed'] = {
        recipient,
        token,
        amount,
        timestamp
      };
      
      console.log(`Tokens distributed to ${recipient}: ${ethers.formatUnits(amount, 18)} tokens at ${new Date(Number(timestamp) * 1000)}`);
      onTokenDistributed?.(event);
    });

    // Listen to NFT mints
    this.faucetManager.on('NFTMinted', (recipient, nftContract, tokenId, timestamp) => {
      const event: FaucetManagerEvents['NFTMinted'] = {
        recipient,
        nftContract,
        tokenId,
        timestamp
      };
      
      console.log(`NFT minted to ${recipient}: Token ID ${tokenId.toString()} at ${new Date(Number(timestamp) * 1000)}`);
      onNFTMinted?.(event);
    });
  }

  // Stop listening to events
  stopListening(): void {
    if (this.faucetManager) {
      this.faucetManager.removeAllListeners();
    }
  }
}

// Example usage
async function example(): Promise<void> {
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
    // Get configurations
    const faucetConfig = await faucet.getFaucetConfig();
    const tokenConfig = await faucet.getTokenConfig();
    const nftConfig = await faucet.getNFTConfig();

    console.log('Faucet config:', faucetConfig);
    console.log('Token config:', tokenConfig);
    console.log('NFT config:', nftConfig);

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

    // Listen to events with typed handlers
    faucet.listenToEvents(
      (event) => {
        console.log('Native token distributed:', event);
      },
      (event) => {
        console.log('Token distributed:', event);
      },
      (event) => {
        console.log('NFT minted:', event);
      }
    );

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

export { FaucetIntegration };

