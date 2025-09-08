// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/FaucetManager.sol";
import "../src/DevNFT.sol";

contract FaucetManagerNFTTest is Test {
    FaucetManager public faucetManager;
    DevNFT public devNFT;

    address public admin;
    address public user1;
    address public user2;
    address public faucetWallet;

    event NFTMinted(address indexed recipient, address indexed nftContract, uint256 tokenId, uint256 timestamp);

    function setUp() public {
        admin = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        faucetWallet = makeAddr("faucetWallet");

        // Deploy contracts
        devNFT = new DevNFT("DevNFT", "DNFT", "https://api.example.com/nft/");
        faucetManager = new FaucetManager();

        // Fund faucet with native tokens for gas
        vm.deal(address(faucetManager), 10 ether);
        vm.deal(faucetWallet, 10 ether);
        
        console.log("FaucetManager address:", address(faucetManager));
        console.log("DevNFT address:", address(devNFT));
        console.log("Admin address:", admin);
        console.log("DevNFT is publicly mintable (no role restrictions)");
    }

    function test_ClaimNFT_Success() public {
        // Test successful NFT claim
        vm.expectEmit(true, true, false, true);
        emit NFTMinted(user1, address(devNFT), 1, block.timestamp);
        
        faucetManager.claimNFT(user1, address(devNFT));
        
        // Verify NFT was minted
        assertEq(devNFT.balanceOf(user1), 1);
        assertEq(devNFT.ownerOf(1), user1);
    }

    function test_ClaimNFT_MultipleUsers() public {
        // Test multiple users can claim NFTs
        faucetManager.claimNFT(user1, address(devNFT));
        faucetManager.claimNFT(user2, address(devNFT));
        
        assertEq(devNFT.balanceOf(user1), 1);
        assertEq(devNFT.balanceOf(user2), 1);
        assertEq(devNFT.ownerOf(1), user1);
        assertEq(devNFT.ownerOf(2), user2);
    }

    function test_ClaimNFT_ReachLimit() public {
        // Mint 10 NFTs to user1 (the maximum limit)
        for (uint i = 0; i < 10; i++) {
            faucetManager.claimNFT(user1, address(devNFT));
        }
        
        assertEq(devNFT.balanceOf(user1), 10);
        
        // The 11th mint should fail
        vm.expectRevert(abi.encodeWithSelector(DevNFT.ExceedsAddressLimit.selector));
        faucetManager.claimNFT(user1, address(devNFT));
    }

    function test_ClaimNFT_AnyoneCanMint() public {
        // DevNFT is publicly mintable - anyone can call mint
        DevNFT newNFT = new DevNFT("NewNFT", "NNFT", "https://api.example.com/nft/");
        
        // FaucetManager should be able to mint even on a new NFT contract
        faucetManager.claimNFT(user1, address(newNFT));
        
        assertEq(newNFT.balanceOf(user1), 1);
    }

    function test_ClaimNFT_InvalidNFTContract() public {
        // Try to claim from a non-NFT contract
        address invalidContract = address(0x1234);
        
        vm.expectRevert();
        faucetManager.claimNFT(user1, invalidContract);
    }

    function test_ClaimNFT_EstimateGas() public {
        // Test gas estimation for NFT claim
        uint256 gasBefore = gasleft();
        faucetManager.claimNFT(user1, address(devNFT));
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for NFT claim:", gasUsed);
        
        // Verify it's within reasonable bounds (typically 100k-200k gas)
        assertLt(gasUsed, 300000);
        assertGt(gasUsed, 50000);
    }

    function test_ClaimNFT_FromEOA() public {
        // Simulate calling from an EOA (like the faucet wallet)
        vm.startPrank(faucetWallet);
        
        // DevNFT is publicly mintable, no role needed
        // Directly call the mint function since selector is ambiguous with overloaded functions
        uint256 tokenId = devNFT.mint(user1);
        console.log("Minted token ID:", tokenId);
        
        vm.stopPrank();
        
        assertEq(devNFT.balanceOf(user1), 1);
        assertEq(devNFT.ownerOf(tokenId), user1);
    }

    function test_ClaimNFT_GasEstimation() public {
        // Test the exact gas estimation that's failing in the TypeScript code
        // Try to estimate gas for the claimNFT function
        try faucetManager.claimNFT(user1, address(devNFT)) {
            console.log("Gas estimation succeeded");
            assertEq(devNFT.balanceOf(user1), 1);
        } catch Error(string memory reason) {
            console.log("Gas estimation failed with reason:", reason);
            revert(reason);
        } catch (bytes memory lowLevelData) {
            console.log("Gas estimation failed with low-level error");
            console.logBytes(lowLevelData);
            revert("Low-level error");
        }
    }

    function test_DebugNFTMintFlow() public {
        // Debug the entire flow step by step
        console.log("\n=== Debug NFT Mint Flow ===");
        
        // Step 1: Check initial state
        console.log("1. Initial state:");
        console.log("   FaucetManager balance:", address(faucetManager).balance);
        console.log("   DevNFT total supply:", devNFT.totalSupply());
        console.log("   User1 NFT balance:", devNFT.balanceOf(user1));
        
        // Step 2: Check permissions
        console.log("\n2. Permissions:");
        console.log("   DevNFT is publicly mintable - no role restrictions");
        console.log("   DevNFT owner:", devNFT.owner());
        
        // Step 3: Attempt to claim NFT
        console.log("\n3. Attempting to claim NFT...");
        
        // Get the calldata that would be sent
        bytes memory claimCalldata = abi.encodeWithSelector(
            FaucetManager.claimNFT.selector,
            user1,
            address(devNFT)
        );
        console.log("   Calldata:");
        console.logBytes(claimCalldata);
        
        // Execute the claim
        (bool success, bytes memory returnData) = address(faucetManager).call(claimCalldata);
        
        if (success) {
            console.log("   Success! Return data:");
            console.logBytes(returnData);
        } else {
            console.log("   Failed! Error data:");
            console.logBytes(returnData);
            
            // Try to decode the error
            if (returnData.length >= 4) {
                bytes4 errorSelector = bytes4(returnData);
                console.log("   Error selector:");
                console.logBytes4(errorSelector);
            }
        }
        
        // Step 4: Check final state
        console.log("\n4. Final state:");
        console.log("   DevNFT total supply:", devNFT.totalSupply());
        console.log("   User1 NFT balance:", devNFT.balanceOf(user1));
        
        assertTrue(success, "NFT claim should succeed");
    }
}