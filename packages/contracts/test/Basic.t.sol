// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/FaucetManager.sol";
import "../src/DevToken.sol";
import "../src/DevNFT.sol";

contract BasicTest is Test {
    FaucetManager public faucetManager;
    DevToken public devToken;
    DevNFT public devNFT;

    address public admin;
    address public user1;

    function setUp() public {
        admin = address(this);
        user1 = makeAddr("user1");

        // Deploy contracts
        devToken = new DevToken("DevToken", "DEV");
        devNFT = new DevNFT("DevNFT", "DNFT", "https://api.example.com/nft/");
        faucetManager = new FaucetManager();

        // Fund faucet with native tokens
        vm.deal(address(faucetManager), 100 ether);
    }

    function test_ContractDeployment() public {
        assertTrue(address(devToken) != address(0));
        assertTrue(address(devNFT) != address(0));
        assertTrue(address(faucetManager) != address(0));
    }

    function test_DevTokenBasic() public {
        assertEq(devToken.name(), "DevToken");
        assertEq(devToken.symbol(), "DEV");
        assertEq(devToken.totalSupply(), 0); // No initial supply
    }

    function test_DevNFTBasic() public {
        assertEq(devNFT.name(), "DevNFT");
        assertEq(devNFT.symbol(), "DNFT");
        assertEq(devNFT.totalSupply(), 0);
    }

    function test_FaucetManagerBasic() public {
        assertEq(faucetManager.owner(), admin);
        assertEq(faucetManager.nativeTokenCooldown(), 24 hours);
        assertEq(faucetManager.nativeTokenAmount(), 0.02 ether);
    }

    function test_DevTokenMint() public {
        uint256 initialSupply = devToken.totalSupply();
        devToken.mint(user1, 1000 * 10**18);
        assertEq(devToken.totalSupply(), initialSupply + 1000 * 10**18);
        assertEq(devToken.balanceOf(user1), 1000 * 10**18);
    }

    function test_DevNFTMint() public {
        uint256 initialSupply = devNFT.totalSupply();
        devNFT.mint(user1);
        assertEq(devNFT.totalSupply(), initialSupply + 1);
        assertEq(devNFT.balanceOf(user1), 1);
        assertEq(devNFT.ownerOf(1), user1);
    }
}

