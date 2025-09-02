import { ethers } from 'ethers';

export interface BalanceResult {
  balance: string;
  formatted: string;
}

export class BalanceService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();

  private getProvider(chainId: number, rpcUrl?: string): ethers.JsonRpcProvider {
    if (!this.providers.has(chainId)) {
      if (!rpcUrl) {
        throw new Error(`No RPC URL provided for chain ${chainId}`);
      }

      this.providers.set(chainId, new ethers.JsonRpcProvider(rpcUrl));
    }

    return this.providers.get(chainId)!;
  }

  async getNativeBalance(walletAddress: string, chainId: number, rpcUrl: string): Promise<BalanceResult> {
    try {
      const provider = this.getProvider(chainId, rpcUrl);
      const balance = await provider.getBalance(walletAddress);
      
      return {
        balance: balance.toString(),
        formatted: ethers.formatEther(balance)
      };
    } catch (error) {
      console.error(`Failed to get native balance for ${walletAddress} on chain ${chainId}:`, error);
      return { balance: "0", formatted: "0.0" };
    }
  }

  async getERC20Balance(
    walletAddress: string, 
    contractAddress: string, 
    chainId: number, 
    decimals: number = 18,
    rpcUrl: string
  ): Promise<BalanceResult> {
    try {
      const provider = this.getProvider(chainId, rpcUrl);
      
      // ERC20 balanceOf ABI
      const erc20Abi = [
        "function balanceOf(address owner) view returns (uint256)"
      ];
      
      const contract = new ethers.Contract(contractAddress, erc20Abi, provider);
      const balanceOf = contract.getFunction('balanceOf');
      const balance = await balanceOf(walletAddress);
      
      return {
        balance: balance.toString(),
        formatted: ethers.formatUnits(balance, decimals)
      };
    } catch (error) {
      console.error(`Failed to get ERC20 balance for ${contractAddress} on chain ${chainId}:`, error);
      return { balance: "0", formatted: "0.0" };
    }
  }

  async getAssetBalance(
    walletAddress: string,
    assetType: string,
    contractAddress: string | null,
    chainId: number,
    decimals: number,
    rpcUrl: string
  ): Promise<BalanceResult> {
    if (assetType === 'native') {
      return this.getNativeBalance(walletAddress, chainId, rpcUrl);
    } else if (assetType === 'erc20' && contractAddress) {
      return this.getERC20Balance(walletAddress, contractAddress, chainId, decimals, rpcUrl);
    } else {
      return { balance: "0", formatted: "0.0" };
    }
  }
}

export const balanceService = new BalanceService();