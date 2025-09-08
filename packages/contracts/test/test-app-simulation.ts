import { ethers } from "ethers";
import { ABIS, getDeploymentAddresses } from "../src/index";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// This test simulates exactly what the application code does
async function testAppSimulation() {
  console.log("🧪 Simulating Application NFT Claim Flow...\n");

  const CHAIN_NAMES: Record<number, string> = {
    11155111: "sepolia",
    4202: "lisk-sepolia",
    80002: "amoy",
    97: "bsc-testnet",
  };

  // Test parameters (same as in the app)
  const chainId = 4202;
  const recipientAddress = ethers.getAddress("0x742d35cc6634c0532925a3b844bc9e7595f0beb4");
  const rpcUrl = "https://rpc.sepolia-api.lisk.com";

  try {
    // Step 1: Get network name (same as faucet.ts line 46)
    const networkName = CHAIN_NAMES[chainId];
    console.log("1️⃣ Network name:", networkName);
    
    if (!networkName) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Step 2: Get deployment addresses (same as faucet.ts line 51)
    const deployment = getDeploymentAddresses(networkName);
    console.log("2️⃣ Deployment loaded:", deployment ? "✅ Yes" : "❌ No");
    
    if (!deployment) {
      throw new Error(`No deployment found for network: ${networkName}`);
    }

    // Step 3: Extract addresses (same as faucet.ts line 56-60)
    const addresses = {
      faucetManager: deployment.faucetManager,
      devToken: deployment.devToken,
      devNFT: deployment.devNFT,
    };
    console.log("3️⃣ Contract addresses:");
    console.log("   FaucetManager:", addresses.faucetManager);
    console.log("   DevNFT:", addresses.devNFT);

    // Step 4: Create provider and wallet (same as faucet.ts)
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const privateKey = process.env.PRIVATE_KEY || ethers.Wallet.createRandom().privateKey;
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("4️⃣ Wallet configured:", wallet.address);

    // Step 5: Create FaucetManager contract (same as faucet.ts line 343-347)
    const faucetManager = new ethers.Contract(
      addresses.faucetManager,
      ABIS.FaucetManager,
      wallet
    );
    console.log("5️⃣ FaucetManager contract created");

    // Step 6: Try gas estimation (same as faucet.ts line 369-374)
    console.log("\n6️⃣ Attempting gas estimation...");
    try {
      const claimFunction = faucetManager.getFunction("claimNFT");
      const estimatedGas = await claimFunction.estimateGas(
        recipientAddress,
        addresses.devNFT
      );
      console.log("   ✅ Gas estimation successful!");
      console.log("   Estimated gas:", estimatedGas.toString());
      
      // If we get here, the app should work!
      console.log("\n✅ SUCCESS! The application should now be able to mint NFTs!");
      console.log("   The fix was adding the deployment file to src/deployments/lisk-sepolia.ts");
      
    } catch (estimateError: any) {
      console.log("   ❌ Gas estimation failed!");
      console.log("   Error:", estimateError.message);
      
      // This is what was happening before the fix
      if (estimateError.message.includes("0xb70f4664") || estimateError.message.includes("NFTMintFailed")) {
        console.log("   → NFT mint would fail (likely reached limit)");
      }
    }

    // Step 7: Verify the actual transaction would work
    console.log("\n7️⃣ Verifying transaction would succeed...");
    try {
      const claimFunction = faucetManager.getFunction("claimNFT");
      await claimFunction.staticCall(recipientAddress, addresses.devNFT);
      console.log("   ✅ Static call successful - transaction would succeed on-chain!");
    } catch (error: any) {
      console.log("   ❌ Static call failed:", error.message);
    }

  } catch (error) {
    console.error("\n💥 Simulation failed:", error);
    console.error("\nThis means the application would fail with the same error.");
  }
}

// Run the simulation
testAppSimulation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });