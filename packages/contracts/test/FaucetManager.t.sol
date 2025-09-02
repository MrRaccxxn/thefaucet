// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/FaucetManager.sol";
import "../src/DevToken.sol";
import "../src/DevNFT.sol";

contract FaucetManagerTest is Test {
    FaucetManager public faucetManager;
    DevToken public devToken;
    DevNFT public devNFT;

    address public admin;
    address public user1;
    address public user2;
    address public blacklistedUser;

    // Test configuration
    uint256 public constant NATIVE_COOLDOWN = 1 hours;
    uint256 public constant NATIVE_AMOUNT = 0.01 ether;
    uint256 public constant TOKEN_AMOUNT = 100 * 10**18;

    event NativeTokenDistributed(address indexed recipient, uint256 amount, uint256 timestamp);
    event TokenDistributed(address indexed recipient, address indexed token, uint256 amount, uint256 timestamp);
    event NFTMinted(address indexed recipient, address indexed nftContract, uint256 tokenId, uint256 timestamp);
    event NativeConfigUpdated(uint256 cooldown, uint256 amount);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount);

    function setUp() public {
        admin = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        blacklistedUser = makeAddr("blacklistedUser");

        // Deploy contracts
        devToken = new DevToken("DevToken", "DEV");
        devNFT = new DevNFT("DevNFT", "DNFT", "https://api.example.com/nft/");
        faucetManager = new FaucetManager();

        // Configure faucet
        faucetManager.updateNativeConfig(NATIVE_COOLDOWN, NATIVE_AMOUNT);

        // Fund faucet with native tokens
        vm.deal(address(faucetManager), 100 ether);
    }

    function test_Constructor() public {
        assertEq(faucetManager.owner(), admin);
        assertEq(faucetManager.nativeTokenAmount(), NATIVE_AMOUNT);
        assertEq(faucetManager.nativeTokenCooldown(), NATIVE_COOLDOWN);
    }

    function test_ClaimNativeToken() public {
        uint256 initialBalance = user1.balance;
        uint256 faucetBalance = address(faucetManager).balance;

        vm.expectEmit(true, false, false, true);
        emit NativeTokenDistributed(user1, NATIVE_AMOUNT, block.timestamp);
        
        faucetManager.claimNativeToken(payable(user1));
        
        assertEq(user1.balance, initialBalance + NATIVE_AMOUNT);
        assertEq(address(faucetManager).balance, faucetBalance - NATIVE_AMOUNT);
    }

    function test_ClaimNativeToken_Cooldown() public {
        faucetManager.claimNativeToken(payable(user1));
        
        vm.expectRevert(FaucetManager.RateLimitExceeded.selector);
        faucetManager.claimNativeToken(payable(user1));
    }

    function test_ClaimNativeToken_AfterCooldown() public {
        faucetManager.claimNativeToken(payable(user1));
        
        // Fast forward past cooldown
        vm.warp(block.timestamp + NATIVE_COOLDOWN + 1);
        
        faucetManager.claimNativeToken(payable(user1));
        
        assertEq(user1.balance, NATIVE_AMOUNT * 2);
    }

    function test_ClaimTokens() public {
        uint256 initialBalance = devToken.balanceOf(user1);

        vm.expectEmit(true, true, false, true);
        emit TokenDistributed(user1, address(devToken), TOKEN_AMOUNT, block.timestamp);
        
        faucetManager.claimTokens(user1, address(devToken), TOKEN_AMOUNT);
        
        assertEq(devToken.balanceOf(user1), initialBalance + TOKEN_AMOUNT);
    }

    function test_ClaimTokens_AddressLimit() public {
        // Try to claim more than the per-address limit (10,000 tokens)
        vm.expectRevert(); // Should fail due to address limit in DevToken
        faucetManager.claimTokens(user1, address(devToken), 15_000 * 10**18);
    }

    function test_ClaimNFT() public {
        uint256 initialSupply = devNFT.totalSupply();
        uint256 userBalance = devNFT.balanceOf(user1);

        vm.expectEmit(true, true, false, true);
        emit NFTMinted(user1, address(devNFT), 1, block.timestamp);
        
        faucetManager.claimNFT(user1, address(devNFT));
        
        assertEq(devNFT.totalSupply(), initialSupply + 1);
        assertEq(devNFT.balanceOf(user1), userBalance + 1);
        assertEq(devNFT.ownerOf(1), user1);
    }

    function test_ClaimNFT_AddressLimit() public {
        // Mint up to the limit (10 NFTs)
        for (uint256 i = 0; i < 10; i++) {
            faucetManager.claimNFT(user1, address(devNFT));
        }
        
        // Should fail on 11th NFT due to address limit
        vm.expectRevert(); // Should fail due to address limit in DevNFT
        faucetManager.claimNFT(user1, address(devNFT));
    }

    function test_CanClaimNative() public {
        // Should be able to claim initially
        assertTrue(faucetManager.canClaimNative(user1));
        
        // Claim tokens
        faucetManager.claimNativeToken(payable(user1));
        
        // Should not be able to claim during cooldown
        assertFalse(faucetManager.canClaimNative(user1));
        
        // Fast forward past cooldown
        vm.warp(block.timestamp + NATIVE_COOLDOWN + 1);
        
        // Should be able to claim again
        assertTrue(faucetManager.canClaimNative(user1));
    }

    function test_UpdateNativeConfig() public {
        uint256 newCooldown = 2 hours;
        uint256 newAmount = 0.05 ether;
        
        vm.expectEmit(false, false, false, true);
        emit NativeConfigUpdated(newCooldown, newAmount);
        
        faucetManager.updateNativeConfig(newCooldown, newAmount);
        
        assertEq(faucetManager.nativeTokenCooldown(), newCooldown);
        assertEq(faucetManager.nativeTokenAmount(), newAmount);
    }

    function test_GetNativeCooldown() public {
        // Should return 0 initially (can claim)
        assertEq(faucetManager.getNativeCooldown(user1), 0);
        
        faucetManager.claimNativeToken(payable(user1));
        
        // Should return remaining cooldown time
        uint256 remaining = faucetManager.getNativeCooldown(user1);
        assertTrue(remaining > 0);
        assertTrue(remaining <= NATIVE_COOLDOWN);
    }

    function test_EmergencyWithdraw() public {
        uint256 initialBalance = admin.balance;
        uint256 faucetBalance = address(faucetManager).balance;
        
        faucetManager.emergencyWithdraw(payable(admin), faucetBalance);
        
        assertEq(admin.balance, initialBalance + faucetBalance);
        assertEq(address(faucetManager).balance, 0);
    }

    function test_Revert_InvalidAddress() public {
        vm.expectRevert(FaucetManager.InvalidAddress.selector);
        faucetManager.claimNativeToken(payable(address(0)));
        
        vm.expectRevert(FaucetManager.InvalidAddress.selector);
        faucetManager.claimTokens(address(0), address(devToken), TOKEN_AMOUNT);
        
        vm.expectRevert(FaucetManager.InvalidAddress.selector);
        faucetManager.claimNFT(address(0), address(devNFT));
    }

    function test_Revert_InvalidAmount() public {
        vm.expectRevert(FaucetManager.InvalidAmount.selector);
        faucetManager.claimTokens(user1, address(devToken), 0);
    }

    function test_Revert_Unauthorized() public {
        vm.prank(user1);
        vm.expectRevert(); // Should fail because user1 is not owner
        faucetManager.updateNativeConfig(1 hours, 0.01 ether);
    }
}
