import { ethers } from 'ethers';
import { ABIS, getDeploymentAddresses } from '@thefaucet/contracts';

export interface ClaimResult {
  transactionHash: string;
  amount: string;
  estimatedConfirmTime: number;
}

const CHAIN_NAMES: Record<number, string> = {
  11155111: 'sepolia',
  4202: 'lisk-sepolia',
  80002: 'amoy',
  97: 'bsc-testnet',
};

export class FaucetService {
  private wallets: Map<number, ethers.Wallet> = new Map();

  private getWallet(chainId: number, rpcUrl: string): ethers.Wallet {
    if (!this.wallets.has(chainId)) {
      const privateKey = process.env.FAUCET_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('FAUCET_PRIVATE_KEY environment variable not set');
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      this.wallets.set(chainId, wallet);
    }

    return this.wallets.get(chainId)!;
  }

  private getContractAddresses(chainId: number) {
    const networkName = CHAIN_NAMES[chainId];
    if (!networkName) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    
    const deployment = getDeploymentAddresses(networkName);
    if (!deployment) {
      throw new Error(`No deployment found for network: ${networkName}`);
    }
    
    return {
      faucetManager: deployment.faucetManager,
      devToken: deployment.devToken,
      devNFT: deployment.devNFT,
    };
  }

  async claimNativeToken(
    recipientAddress: string,
    chainId: number,
    rpcUrl: string
  ): Promise<ClaimResult> {
    try {
      const wallet = this.getWallet(chainId, rpcUrl);
      const addresses = this.getContractAddresses(chainId);
      
      // Use FaucetManager contract
      const faucetManager = new ethers.Contract(
        addresses.faucetManager,
        ABIS.FaucetManager,
        wallet
      );
      
      // Call claimNativeToken on the contract
      const claimFunction = faucetManager.getFunction('claimNativeToken');
      const tx = await claimFunction(recipientAddress);
      
      // Get the amount from contract
      const amountFunction = faucetManager.getFunction('nativeTokenAmount');
      const amount = await amountFunction();
      
      return {
        transactionHash: tx.hash,
        amount: ethers.formatEther(amount),
        estimatedConfirmTime: 30,
      };
    } catch (error) {
      console.error(`Failed to claim native token:`, error);
      if (error instanceof Error) {
        if (error.message.includes('RateLimitExceeded')) {
          throw new Error('Rate limit exceeded. Please wait before claiming again.');
        }
        if (error.message.includes('InsufficientBalance')) {
          throw new Error('Faucet has insufficient balance.');
        }
      }
      throw new Error('Failed to process native token claim');
    }
  }

  async claimERC20Token(
    recipientAddress: string,
    amount: string,
    chainId: number,
    rpcUrl: string
  ): Promise<ClaimResult> {
    try {
      const wallet = this.getWallet(chainId, rpcUrl);
      const addresses = this.getContractAddresses(chainId);
      
      // Use FaucetManager contract to claim tokens
      const faucetManager = new ethers.Contract(
        addresses.faucetManager,
        ABIS.FaucetManager,
        wallet
      );
      
      const amountUnits = ethers.parseUnits(amount, 18); // DevToken uses 18 decimals
      
      // Use FaucetManager to mint tokens to recipient
      const claimFunction = faucetManager.getFunction('claimTokens');
      const tx = await claimFunction(
        recipientAddress,
        addresses.devToken,
        amountUnits
      );

      return {
        transactionHash: tx.hash,
        amount,
        estimatedConfirmTime: 30,
      };
    } catch (error) {
      console.error(`Failed to claim ERC20 token:`, error);
      if (error instanceof Error) {
        if (error.message.includes('RateLimitExceeded')) {
          throw new Error('Rate limit exceeded. Please wait before claiming again.');
        }
        if (error.message.includes('InsufficientBalance')) {
          throw new Error('Faucet has insufficient token balance.');
        }
        if (error.message.includes('TokenMintFailed')) {
          throw new Error('Token minting failed. Please try again.');
        }
      }
      throw new Error('Failed to process ERC20 token claim');
    }
  }

  async mintNFT(
    recipientAddress: string,
    chainId: number,
    rpcUrl: string
  ): Promise<ClaimResult> {
    try {
      const wallet = this.getWallet(chainId, rpcUrl);
      const addresses = this.getContractAddresses(chainId);
      
      // Use FaucetManager contract to mint NFT
      const faucetManager = new ethers.Contract(
        addresses.faucetManager,
        ABIS.FaucetManager,
        wallet
      );
      
      // Use FaucetManager to mint NFT to recipient
      const claimFunction = faucetManager.getFunction('claimNFT');
      const tx = await claimFunction(
        recipientAddress,
        addresses.devNFT
      );

      return {
        transactionHash: tx.hash,
        amount: "1", // NFT count
        estimatedConfirmTime: 30,
      };
    } catch (error) {
      console.error(`Failed to mint NFT:`, error);
      if (error instanceof Error) {
        if (error.message.includes('RateLimitExceeded')) {
          throw new Error('Rate limit exceeded. Please wait before claiming again.');
        }
        if (error.message.includes('NFTMintFailed')) {
          throw new Error('NFT minting failed. Please try again.');
        }
      }
      throw new Error('Failed to process NFT claim');
    }
  }
}

export const faucetService = new FaucetService();