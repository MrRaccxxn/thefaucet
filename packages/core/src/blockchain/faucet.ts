import { ethers } from 'ethers';

export interface ClaimResult {
  transactionHash: string;
  amount: string;
  estimatedConfirmTime: number;
}

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

  async claimNativeToken(
    recipientAddress: string,
    amount: string,
    chainId: number,
    rpcUrl: string
  ): Promise<ClaimResult> {
    try {
      const wallet = this.getWallet(chainId, rpcUrl);
      
      // Convert amount to wei
      const amountWei = ethers.parseEther(amount);
      
      // Send native token
      const tx = await wallet.sendTransaction({
        to: recipientAddress,
        value: amountWei,
      });

      return {
        transactionHash: tx.hash,
        amount,
        estimatedConfirmTime: 30, // seconds
      };
    } catch (error) {
      console.error(`Failed to claim native token:`, error);
      throw new Error('Failed to process native token claim');
    }
  }

  async claimERC20Token(
    recipientAddress: string,
    amount: string,
    contractAddress: string,
    decimals: number,
    chainId: number,
    rpcUrl: string
  ): Promise<ClaimResult> {
    try {
      const wallet = this.getWallet(chainId, rpcUrl);
      
      // ERC20 transfer ABI
      const erc20Abi = [
        "function transfer(address to, uint256 amount) returns (bool)"
      ];
      
      const contract = new ethers.Contract(contractAddress, erc20Abi, wallet);
      const amountUnits = ethers.parseUnits(amount, decimals);
      
      // Transfer tokens
      const transferFunction = contract.getFunction('transfer');
      const tx = await transferFunction(recipientAddress, amountUnits);

      return {
        transactionHash: tx.hash,
        amount,
        estimatedConfirmTime: 30,
      };
    } catch (error) {
      console.error(`Failed to claim ERC20 token:`, error);
      throw new Error('Failed to process ERC20 token claim');
    }
  }

  async mintNFT(
    recipientAddress: string,
    contractAddress: string,
    tokenURI: string,
    chainId: number,
    rpcUrl: string
  ): Promise<ClaimResult> {
    try {
      const wallet = this.getWallet(chainId, rpcUrl);
      
      // Simple NFT mint ABI (assuming ERC721 with mint function)
      const nftAbi = [
        "function mint(address to, string memory tokenURI) returns (uint256)"
      ];
      
      const contract = new ethers.Contract(contractAddress, nftAbi, wallet);
      
      // Mint NFT
      const mintFunction = contract.getFunction('mint');
      const tx = await mintFunction(recipientAddress, tokenURI);

      // Get the token ID from transaction receipt (simplified)
      const tokenId = "1"; // This should be parsed from the transaction receipt

      return {
        transactionHash: tx.hash,
        amount: tokenId,
        estimatedConfirmTime: 30,
      };
    } catch (error) {
      console.error(`Failed to mint NFT:`, error);
      throw new Error('Failed to process NFT claim');
    }
  }
}

export const faucetService = new FaucetService();