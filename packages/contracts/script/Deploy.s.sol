// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/FaucetManager.sol";
import "../src/DevToken.sol";
import "../src/DevNFT.sol";

/**
 * @title Deploy
 * @dev Deployment script for all faucet contracts
 */
contract Deploy is Script {
    // Contract instances
    FaucetManager public faucetManager;
    DevToken public devToken;
    DevNFT public devNFT;

    // Deployment addresses
    address public deployer;
    address public admin;

    // Token configuration
    string public constant TOKEN_NAME = "DevToken";
    string public constant TOKEN_SYMBOL = "DEV";

    // NFT configuration
    string public constant NFT_NAME = "DevNFT";
    string public constant NFT_SYMBOL = "DNFT";
    string public constant NFT_BASE_URI = "https://api.example.com/nft/";

    // Faucet configuration
    uint256 public constant NATIVE_COOLDOWN = 24 hours;
    uint256 public constant NATIVE_AMOUNT = 0.02 ether;

    function setUp() public {
        deployer = msg.sender;
        admin = vm.envOr("ADMIN_ADDRESS", deployer);
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy DevToken first
        console.log("Deploying DevToken...");
        devToken = new DevToken(
            TOKEN_NAME,
            TOKEN_SYMBOL
        );
        console.log("DevToken deployed at:", address(devToken));

        // Deploy DevNFT
        console.log("Deploying DevNFT...");
        devNFT = new DevNFT(
            NFT_NAME,
            NFT_SYMBOL,
            NFT_BASE_URI
        );
        console.log("DevNFT deployed at:", address(devNFT));

        // Deploy FaucetManager
        console.log("Deploying FaucetManager...");
        faucetManager = new FaucetManager();
        console.log("FaucetManager deployed at:", address(faucetManager));

        // Configure FaucetManager
        console.log("Configuring FaucetManager...");
        faucetManager.updateNativeConfig(NATIVE_COOLDOWN, NATIVE_AMOUNT);

        // Transfer ownership to admin if different from deployer
        if (deployer != admin) {
            console.log("Transferring ownership to admin...");
            devToken.transferOwnership(admin);
            devNFT.transferOwnership(admin);
            faucetManager.transferOwnership(admin);
        }

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", vm.envString("NETWORK"));
        console.log("Deployer:", deployer);
        console.log("Admin:", admin);
        console.log("DevToken:", address(devToken));
        console.log("DevNFT:", address(devNFT));
        console.log("FaucetManager:", address(faucetManager));
        console.log("========================\n");

        // Save deployment addresses
        saveDeploymentAddresses();
    }

    function saveDeploymentAddresses() internal {
        string memory deploymentData = string(abi.encodePacked(
            '{"network":"', vm.envString("NETWORK"), '",',
            '"deployer":"', vm.toString(deployer), '",',
            '"admin":"', vm.toString(admin), '",',
            '"devToken":"', vm.toString(address(devToken)), '",',
            '"devNFT":"', vm.toString(address(devNFT)), '",',
            '"faucetManager":"', vm.toString(address(faucetManager)), '",',
            '"deploymentTime":"', vm.toString(block.timestamp), '"}'
        ));

        string memory filename = string(abi.encodePacked(
            "deployment-", vm.envString("NETWORK"), "-", vm.toString(block.timestamp), ".json"
        ));

        vm.writeFile(filename, deploymentData);
        console.log("Deployment data saved to:", filename);
    }
}
