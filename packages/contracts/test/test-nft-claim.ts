import { ethers } from "ethers";
import { ABIS, getDeploymentAddresses } from "../src/index";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function testNFTClaim() {
  console.log("🧪 Testing NFT Claim Gas Estimation on Lisk Sepolia...\n");

  // Configuration
  const chainId = 4202; // Lisk Sepolia
  const networkName = "lisk-sepolia";
  const rpcUrl = "https://rpc.sepolia-api.lisk.com";
  const testRecipient = ethers.getAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb4"); // Test address with proper checksum

  try {
    // Get deployment addresses
    const deployment = getDeploymentAddresses(networkName);
    console.log("📋 Deployment addresses:", deployment);
    
    if (!deployment) {
      throw new Error(`No deployment found for network: ${networkName}`);
    }

    if (!deployment.faucetManager || !deployment.devNFT) {
      throw new Error("Missing contract addresses in deployment");
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log("🌐 Connected to:", rpcUrl);

    // Try to get private key from env, or create a random wallet for testing
    const privateKey = process.env.PRIVATE_KEY || ethers.Wallet.createRandom().privateKey;
    
    // Create wallet
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("👛 Wallet address:", wallet.address);

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Wallet balance:", ethers.formatEther(balance), "ETH");
    
    if (!process.env.PRIVATE_KEY) {
      console.log("⚠️  Using random wallet for testing (no PRIVATE_KEY in env)\n");
    } else {
      console.log("");
    }

    // Create contract instances
    const faucetManager = new ethers.Contract(
      deployment.faucetManager,
      ABIS.FaucetManager,
      wallet
    );

    const devNFT = new ethers.Contract(
      deployment.devNFT,
      ABIS.DevNFT,
      provider
    );

    console.log("📊 Contract Details:");
    console.log("  FaucetManager:", deployment.faucetManager);
    console.log("  DevNFT:", deployment.devNFT);

    // Check current NFT state
    const totalSupply = await devNFT.totalSupply();
    const recipientBalance = await devNFT.balanceOf(testRecipient);
    const mintedCount = await devNFT.mintedCount(testRecipient);
    
    console.log("\n📈 NFT State:");
    console.log("  Total Supply:", totalSupply.toString());
    console.log("  Recipient Balance:", recipientBalance.toString());
    console.log("  Minted Count:", mintedCount.toString());
    console.log("  Can mint more?:", mintedCount < 10);

    if (mintedCount >= 10) {
      console.log("\n⚠️  Warning: Test recipient has reached the maximum NFT limit (10)");
      console.log("    Using a different test address...");
      // Generate a random address for testing
      const randomWallet = ethers.Wallet.createRandom();
      console.log("    New test recipient:", randomWallet.address);
    }

    // Test 1: Direct gas estimation
    console.log("\n🔍 Test 1: Direct Gas Estimation");
    try {
      const claimFunction = faucetManager.getFunction("claimNFT");
      const estimatedGas = await claimFunction.estimateGas(
        testRecipient,
        deployment.devNFT
      );
      console.log("  ✅ Gas estimation successful!");
      console.log("  Estimated gas:", estimatedGas.toString());
      console.log("  Estimated gas (formatted):", Number(estimatedGas).toLocaleString());
    } catch (error: any) {
      console.log("  ❌ Gas estimation failed!");
      console.log("  Error:", error.message);
      
      // Parse error details
      if (error.data) {
        console.log("  Error data:", error.data);
      }
      if (error.reason) {
        console.log("  Error reason:", error.reason);
      }
    }

    // Test 2: Static call (simulation)
    console.log("\n🔍 Test 2: Static Call Simulation");
    try {
      // Try to simulate the transaction without actually sending it
      const claimFunction = faucetManager.getFunction("claimNFT");
      await claimFunction.staticCall(testRecipient, deployment.devNFT);
      console.log("  ✅ Static call successful! Transaction would succeed.");
    } catch (error: any) {
      console.log("  ❌ Static call failed!");
      console.log("  Error:", error.message);
      
      // Check for specific error types
      if (error.message.includes("NFTMintFailed")) {
        console.log("  → NFT mint would fail (likely reached limit)");
      }
      if (error.message.includes("ExceedsAddressLimit")) {
        console.log("  → Address has reached maximum NFT limit");
      }
    }

    // Test 3: Check contract code exists
    console.log("\n🔍 Test 3: Contract Verification");
    const faucetManagerCode = await provider.getCode(deployment.faucetManager);
    const devNFTCode = await provider.getCode(deployment.devNFT);
    
    console.log("  FaucetManager has code:", faucetManagerCode.length > 2 ? "✅ Yes" : "❌ No");
    console.log("  DevNFT has code:", devNFTCode.length > 2 ? "✅ Yes" : "❌ No");

    // Test 4: Try with different recipient addresses
    console.log("\n🔍 Test 4: Testing with Multiple Recipients");
    const testAddresses = [
      testRecipient,
      ethers.Wallet.createRandom().address,
      ethers.Wallet.createRandom().address,
    ];

    for (const address of testAddresses) {
      try {
        const mintedCount = await devNFT.mintedCount(address);
        const claimFunction = faucetManager.getFunction("claimNFT");
        const estimatedGas = await claimFunction.estimateGas(address, deployment.devNFT);
        console.log(`  ✅ ${address.substring(0, 8)}... (minted: ${mintedCount}) - Gas: ${estimatedGas}`);
      } catch (error: any) {
        const mintedCount = await devNFT.mintedCount(address);
        console.log(`  ❌ ${address.substring(0, 8)}... (minted: ${mintedCount}) - Error: ${error.reason || error.message.substring(0, 50)}`);
      }
    }

    console.log("\n✨ Test completed!");

  } catch (error) {
    console.error("\n💥 Test failed with error:", error);
    process.exit(1);
  }
}

// Run the test
testNFTClaim()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });