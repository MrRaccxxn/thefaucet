// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title FaucetManager
 * @dev Simplified proxy contract for managing token distribution
 * 
 * ⚠️  WARNING: THIS CONTRACT IS FOR TESTNET USE ONLY ⚠️
 * This contract provides simple distribution without complex access controls.
 * NEVER deploy this contract on mainnet or any production environment.
 */
contract FaucetManager is Ownable, ReentrancyGuard {
    using Address for address payable;

    // Rate limiting for native tokens only (other assets handled by their contracts)
    mapping(address => uint256) public lastNativeClaimTime;

    // Configuration
    uint256 public nativeTokenCooldown = 24 hours;
    uint256 public nativeTokenAmount = 0.02 ether;

    // Events
    event NativeTokenDistributed(address indexed recipient, uint256 amount, uint256 timestamp);
    event TokenDistributed(address indexed recipient, address indexed token, uint256 amount, uint256 timestamp);
    event NFTMinted(address indexed recipient, address indexed nftContract, uint256 tokenId, uint256 timestamp);
    event NativeConfigUpdated(uint256 cooldown, uint256 amount);
    event EmergencyWithdrawal(address indexed recipient, uint256 amount);

    // Errors
    error InsufficientBalance();
    error RateLimitExceeded();
    error InvalidAmount();
    error InvalidAddress();
    error TokenMintFailed();
    error NFTMintFailed();

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Distribute native tokens to a recipient
     * @param recipient Address to receive the tokens
     */
    function claimNativeToken(address payable recipient) external nonReentrant {
        if (recipient == address(0)) revert InvalidAddress();
        if (address(this).balance < nativeTokenAmount) revert InsufficientBalance();
        
        if (lastNativeClaimTime[recipient] + nativeTokenCooldown > block.timestamp) {
            revert RateLimitExceeded();
        }

        lastNativeClaimTime[recipient] = block.timestamp;
        recipient.sendValue(nativeTokenAmount);
        
        emit NativeTokenDistributed(recipient, nativeTokenAmount, block.timestamp);
    }

    /**
     * @dev Proxy function to mint ERC20 tokens to a recipient
     * @param recipient Address to receive the tokens
     * @param tokenAddress Address of the ERC20 token contract
     * @param amount Amount to mint
     */
    function claimTokens(
        address recipient, 
        address tokenAddress, 
        uint256 amount
    ) external nonReentrant {
        if (recipient == address(0) || tokenAddress == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        
        // Call the token contract's public mint function
        // The token contract handles per-address limits
        (bool success, ) = tokenAddress.call(
            abi.encodeWithSignature("mint(address,uint256)", recipient, amount)
        );
        if (!success) revert TokenMintFailed();
        
        emit TokenDistributed(recipient, tokenAddress, amount, block.timestamp);
    }

    /**
     * @dev Proxy function to mint NFT to a recipient
     * @param recipient Address to receive the NFT
     * @param nftContract Address of the NFT contract
     */
    function claimNFT(address recipient, address nftContract) external nonReentrant {
        if (recipient == address(0) || nftContract == address(0)) revert InvalidAddress();
        
        // Call the NFT contract's public mint function
        // The NFT contract handles per-address limits
        (bool success, bytes memory data) = nftContract.call(
            abi.encodeWithSignature("mint(address)", recipient)
        );
        if (!success) revert NFTMintFailed();
        
        uint256 tokenId = abi.decode(data, (uint256));
        emit NFTMinted(recipient, nftContract, tokenId, block.timestamp);
    }

    /**
     * @dev Update native token configuration (owner only)
     * @param newCooldown New cooldown period in seconds
     * @param newAmount New amount to distribute per claim
     */
    function updateNativeConfig(uint256 newCooldown, uint256 newAmount) external onlyOwner {
        nativeTokenCooldown = newCooldown;
        nativeTokenAmount = newAmount;
        emit NativeConfigUpdated(newCooldown, newAmount);
    }

    /**
     * @dev Emergency withdrawal of native tokens (owner only)
     * @param recipient Address to receive the tokens
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address payable recipient, uint256 amount) external onlyOwner {
        if (recipient == address(0)) revert InvalidAddress();
        if (amount > address(this).balance) revert InsufficientBalance();
        
        recipient.sendValue(amount);
        emit EmergencyWithdrawal(recipient, amount);
    }

    /**
     * @dev Check if user can claim native tokens
     * @param user Address of the user
     * @return Whether the user can claim native tokens
     */
    function canClaimNative(address user) external view returns (bool) {
        return lastNativeClaimTime[user] + nativeTokenCooldown <= block.timestamp;
    }

    /**
     * @dev Get remaining cooldown time for native token claims
     * @param user Address of the user
     * @return remainingTime Time remaining in seconds (0 if can claim)
     */
    function getNativeCooldown(address user) external view returns (uint256 remainingTime) {
        uint256 lastClaim = lastNativeClaimTime[user];
        if (lastClaim + nativeTokenCooldown <= block.timestamp) {
            return 0;
        }
        return lastClaim + nativeTokenCooldown - block.timestamp;
    }

    // Receive function to accept native tokens
    receive() external payable {}
}
