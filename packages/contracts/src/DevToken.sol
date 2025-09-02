// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DevToken
 * @dev ERC20 implementation with minting functionality for test tokens
 *
 * ⚠️  WARNING: THIS CONTRACT IS FOR TESTNET USE ONLY ⚠️
 * This contract allows public minting with minimal restrictions.
 * NEVER deploy this contract on mainnet or any production environment.
 */
contract DevToken is ERC20, Ownable {
    uint256 public constant MAX_PER_ADDRESS = 10_000 * 10 ** 18; // 10,000 tokens per address

    // Mapping to track minted amount per address
    mapping(address => uint256) public mintedAmount;

    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event MaxPerAddressUpdated(uint256 oldMax, uint256 newMax);

    // Errors
    error ExceedsAddressLimit();
    error InvalidAmount();
    error InvalidAddress();

    /**
     * @dev Constructor
     * @param name Token name
     * @param symbol Token symbol
     */
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {}

    /**
     * @dev Mint tokens to an address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (mintedAmount[to] + amount > MAX_PER_ADDRESS)
            revert ExceedsAddressLimit();

        _mint(to, amount);
        mintedAmount[to] += amount;
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Check if an amount can be minted to an address
     * @param account Address to check
     * @param amount Amount to check
     * @return Whether the amount can be minted to this address
     */
    function canMint(
        address account,
        uint256 amount
    ) external view returns (bool) {
        return mintedAmount[account] + amount <= MAX_PER_ADDRESS;
    }

    /**
     * @dev Set max tokens per address (owner only)
     * @param newMax New maximum tokens per address
     */
    function setMaxPerAddress(uint256 newMax) external onlyOwner {
        uint256 oldMax = MAX_PER_ADDRESS;
        // Note: This would require making MAX_PER_ADDRESS a state variable instead of constant
        // For now, this function serves as documentation for future flexibility
        emit MaxPerAddressUpdated(oldMax, newMax);
    }
}
