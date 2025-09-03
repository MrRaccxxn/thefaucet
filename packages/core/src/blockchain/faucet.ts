import { ethers } from "ethers";
import { ABIS, getDeploymentAddresses } from "@thefaucet/contracts";

export interface ClaimResult {
  transactionHash: string;
  amount: string;
  estimatedConfirmTime: number;
}

const CHAIN_NAMES: Record<number, string> = {
  11155111: "sepolia",
  4202: "lisk-sepolia",
  80002: "amoy",
  97: "bsc-testnet",
};

export class FaucetService {
  private wallets: Map<number, ethers.Wallet> = new Map();

  private getWallet(chainId: number, rpcUrl: string): ethers.Wallet {
    if (!this.wallets.has(chainId)) {
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error(
          "PRIVATE_KEY environment variable not set. Please configure the transaction signer wallet."
        );
      }

      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        this.wallets.set(chainId, wallet);
        console.log(
          `✅ Wallet configured for chain ${chainId} - Address: ${wallet.address}`
        );
      } catch (error) {
        console.error("Failed to create wallet:", error);
        throw new Error("Invalid private key or RPC connection failed");
      }
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
    console.log("=== FaucetService.claimNativeToken ===");
    console.log("Recipient:", recipientAddress);
    console.log("ChainId:", chainId);
    console.log("RPC URL:", rpcUrl);

    let faucetManager: ethers.Contract | null = null;

    try {
      const wallet = this.getWallet(chainId, rpcUrl);
      console.log("Wallet address:", wallet.address);

      const addresses = this.getContractAddresses(chainId);
      console.log("Contract addresses:", addresses);

      // Use FaucetManager contract
      console.log("Creating FaucetManager contract instance...");
      faucetManager = new ethers.Contract(
        addresses.faucetManager,
        ABIS.FaucetManager,
        wallet
      );

      // Check wallet balance for gas
      if (!wallet.provider) {
        throw new Error("Wallet provider is not available");
      }

      const walletBalance = await wallet.provider.getBalance(wallet.address);
      console.log(
        "Wallet ETH balance for gas:",
        ethers.formatEther(walletBalance)
      );

      // Check contract balance
      const contractBalance = await wallet.provider.getBalance(
        addresses.faucetManager
      );
      console.log(
        "FaucetManager contract ETH balance:",
        ethers.formatEther(contractBalance)
      );

      // Check if user can claim from blockchain contract (24-hour cooldown)
      console.log("Checking blockchain cooldown for user...");
      const canClaimFunction = faucetManager.getFunction("canClaimNative");
      const canClaim = await canClaimFunction(recipientAddress);

      if (!canClaim) {
        console.log("User cannot claim due to blockchain cooldown");
        const getCooldownFunction =
          faucetManager.getFunction("getNativeCooldown");
        const remainingTime = await getCooldownFunction(recipientAddress);
        const remainingHours = Math.ceil(Number(remainingTime) / 3600);
        throw new Error(
          `You must wait ${remainingHours} hours before claiming again from this address.`
        );
      }

      // Call claimNativeToken on the contract
      console.log("Calling claimNativeToken on contract...");
      const claimFunction = faucetManager.getFunction("claimNativeToken");
      const tx = await claimFunction(recipientAddress);
      console.log("Transaction sent:", tx.hash);

      // Get the amount from contract
      const amountFunction = faucetManager.getFunction("nativeTokenAmount");
      const amount = await amountFunction();

      return {
        transactionHash: tx.hash,
        amount: ethers.formatEther(amount),
        estimatedConfirmTime: 30,
      };
    } catch (error) {
      console.error("=== FAUCET SERVICE ERROR ===");
      console.error("Full error object:", error);

      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        // Check for common errors
        if (
          error.message.includes("RateLimitExceeded") ||
          error.message.includes("0xf4d678b8")
        ) {
          // This should rarely happen since our database rate limiting should catch it first
          console.warn('Rate limit error reached blockchain - database rate limiting may have missed this');
          
          // Try to get the exact cooldown time from the contract
          try {
            if (!faucetManager) {
              throw new Error('FaucetManager contract not initialized');
            }
            console.log('Querying contract for user cooldown time...');
            const lastClaimTime = await faucetManager.getUserLastClaimTime(recipientAddress);
            const cooldownPeriod = await faucetManager.CLAIM_COOLDOWN();
            
            const lastClaimTimestamp = Number(lastClaimTime) * 1000; // Convert to milliseconds
            const cooldownMs = Number(cooldownPeriod) * 1000; // Convert to milliseconds
            const canClaimAt = new Date(lastClaimTimestamp + cooldownMs);
            const now = new Date();
            
            if (canClaimAt > now) {
              const timeRemainingMs = canClaimAt.getTime() - now.getTime();
              const totalMinutes = Math.ceil(timeRemainingMs / 1000 / 60);
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              
              let timeMessage;
              if (hours > 0) {
                timeMessage = minutes > 0 
                  ? `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
                  : `${hours} hour${hours !== 1 ? 's' : ''}`;
              } else {
                timeMessage = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
              }
              
              throw new Error(
                `You have already claimed native tokens on this network. Please wait ${timeMessage} before claiming again.`
              );
            }
          } catch (contractQueryError) {
            console.error('Failed to query contract for cooldown time:', contractQueryError);
          }
          
          // Fallback to generic message
          throw new Error(
            "You have already claimed from this address recently. Please wait before claiming again."
          );
        }
        if (error.message.includes("InsufficientBalance")) {
          throw new Error("FaucetManager contract has insufficient balance.");
        }
        if (error.message.includes("could not detect network")) {
          throw new Error("Network connection failed. Check RPC URL.");
        }
        if (error.message.includes("insufficient funds")) {
          throw new Error("Wallet has insufficient ETH for gas fees.");
        }

        // Throw the original error with more context
        throw new Error(`FaucetService error: ${error.message}`);
      }

      throw new Error("Failed to process native token claim - unknown error");
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
      const claimFunction = faucetManager.getFunction("claimTokens");
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
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown',
        name: error instanceof Error ? error.name : 'Unknown',
      });
      
      if (error instanceof Error) {
        // Check for the DevToken's address limit error
        if (error.message.includes("ExceedsAddressLimit") || error.message.includes("0x1f2e1c3d")) {
          throw new Error(
            "You have reached the maximum lifetime limit of 10,000 DEV tokens per address."
          );
        }
        // Check for TokenMintFailed which could mean various things
        if (error.message.includes("TokenMintFailed") || error.message.includes("0x6a172882")) {
          // Try to get more specific error
          if (error.message.includes("ExceedsAddressLimit")) {
            throw new Error("You have reached the maximum lifetime limit of 10,000 DEV tokens per address.");
          }
          throw new Error("Token minting failed. You may have reached your token limit or there's an issue with the token contract.");
        }
        // This would be from native token claims, not ERC20
        if (error.message.includes("RateLimitExceeded") || error.message.includes("0xf4d678b8")) {
          console.error("WARNING: RateLimitExceeded error in ERC20 token claim - this shouldn't happen!");
          throw new Error(
            "Unexpected rate limit error. The smart contract may be misconfigured. Please contact support."
          );
        }
        if (error.message.includes("InsufficientBalance")) {
          throw new Error("Faucet has insufficient token balance.");
        }
        // Pass through any other specific error message
        throw new Error(`Token claim failed: ${error.message}`);
      }
      throw new Error("Failed to process ERC20 token claim - unknown error");
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
      const claimFunction = faucetManager.getFunction("claimNFT");
      const tx = await claimFunction(recipientAddress, addresses.devNFT);

      return {
        transactionHash: tx.hash,
        amount: "1", // NFT count
        estimatedConfirmTime: 30,
      };
    } catch (error) {
      console.error(`Failed to mint NFT:`, error);
      if (error instanceof Error) {
        if (error.message.includes("RateLimitExceeded")) {
          throw new Error(
            "Rate limit exceeded. Please wait before claiming again."
          );
        }
        if (error.message.includes("NFTMintFailed")) {
          throw new Error("NFT minting failed. Please try again.");
        }
      }
      throw new Error("Failed to process NFT claim");
    }
  }
}

export const faucetService = new FaucetService();
