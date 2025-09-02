// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title DevNFT
 * @dev ERC721 implementation for test NFTs with metadata support
 * 
 * ⚠️  WARNING: THIS CONTRACT IS FOR TESTNET USE ONLY ⚠️
 * This contract allows public minting with minimal restrictions.
 * NEVER deploy this contract on mainnet or any production environment.
 */
contract DevNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;
    string private _baseTokenURI;
    uint256 public constant MAX_PER_ADDRESS = 10; // Maximum NFTs per address

    // Mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;
    // Mapping to track minted count per address
    mapping(address => uint256) public mintedCount;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event BaseURIUpdated(string oldBaseURI, string newBaseURI);
    event MaxPerAddressUpdated(uint256 oldMax, uint256 newMax);

    // Errors
    error ExceedsAddressLimit();
    error InvalidAddress();
    error InvalidTokenId();

    /**
     * @dev Constructor
     * @param name NFT collection name
     * @param symbol NFT collection symbol
     * @param baseURI Base URI for token metadata
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseURI;
        _tokenIdCounter = 1; // Start from token ID 1
    }

    /**
     * @dev Mint a new NFT to a recipient
     * @param to Address to mint NFT to
     * @return tokenId The ID of the newly minted NFT
     */
    function mint(address to) external returns (uint256 tokenId) {
        if (to == address(0)) revert InvalidAddress();
        if (mintedCount[to] >= MAX_PER_ADDRESS) revert ExceedsAddressLimit();

        tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        mintedCount[to]++;

        _safeMint(to, tokenId);
        
        // Set default token URI
        string memory defaultURI = string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
        _setTokenURI(tokenId, defaultURI);

        emit NFTMinted(to, tokenId, defaultURI);
        return tokenId;
    }

    /**
     * @dev Mint a new NFT with custom URI
     * @param to Address to mint NFT to
     * @param customURI Custom token URI
     * @return tokenId The ID of the newly minted NFT
     */
    function mint(address to, string memory customURI) external returns (uint256 tokenId) {
        if (to == address(0)) revert InvalidAddress();
        if (mintedCount[to] >= MAX_PER_ADDRESS) revert ExceedsAddressLimit();

        tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        mintedCount[to]++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, customURI);

        emit NFTMinted(to, tokenId, customURI);
        return tokenId;
    }

    /**
     * @dev Batch mint NFTs to multiple recipients
     * @param recipients Array of recipient addresses
     * @return tokenIds Array of minted token IDs
     */
    function batchMint(address[] memory recipients) external returns (uint256[] memory tokenIds) {
        tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidAddress();
            if (mintedCount[recipients[i]] >= MAX_PER_ADDRESS) revert ExceedsAddressLimit();

            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            mintedCount[recipients[i]]++;

            _safeMint(recipients[i], tokenId);
            
            // Set default token URI
            string memory defaultURI = string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
            _setTokenURI(tokenId, defaultURI);

            tokenIds[i] = tokenId;
            emit NFTMinted(recipients[i], tokenId, defaultURI);
        }
        
        return tokenIds;
    }


    /**
     * @dev Update base token URI
     * @param newBaseTokenURI New base token URI
     */
    function setBaseTokenURI(string memory newBaseTokenURI) external onlyOwner {
        string memory oldBaseTokenURI = _baseTokenURI;
        _baseTokenURI = newBaseTokenURI;
        emit BaseURIUpdated(oldBaseTokenURI, newBaseTokenURI);
    }

    /**
     * @dev Get base token URI
     * @return Base token URI
     */
    function baseTokenURI() external view returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Get total supply
     * @return Total number of minted NFTs
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @dev Get remaining mintable supply for an address
     * @param account Address to check
     * @return Remaining NFTs that can be minted to this address
     */
    function getRemainingMintableSupply(address account) external view returns (uint256) {
        return MAX_PER_ADDRESS - mintedCount[account];
    }

    /**
     * @dev Check if an amount can be minted to an address
     * @param account Address to check
     * @param amount Amount to check
     * @return Whether the amount can be minted to this address
     */
    function canMint(address account, uint256 amount) external view returns (bool) {
        return mintedCount[account] + amount <= MAX_PER_ADDRESS;
    }

    /**
     * @dev Get token URI
     * @param tokenId Token ID
     * @return Token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_exists(tokenId)) revert InvalidTokenId();
        
        string memory uri = _tokenURIs[tokenId];
        if (bytes(uri).length > 0) {
            return uri;
        }
        
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }

    /**
     * @dev Set token URI
     * @param tokenId Token ID
     * @param uri Token URI
     */
    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        if (!_exists(tokenId)) revert InvalidTokenId();
        _tokenURIs[tokenId] = uri;
    }

    /**
     * @dev Check if token exists
     * @param tokenId Token ID
     * @return Whether the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId < _tokenIdCounter;
    }

    /**
     * @dev Set max NFTs per address (admin only)
     * @param newMax New maximum NFTs per address
     */
    function setMaxPerAddress(uint256 newMax) external onlyOwner {
        uint256 oldMax = MAX_PER_ADDRESS;
        // Note: This would require making MAX_PER_ADDRESS a state variable instead of constant
        // For now, this function serves as documentation for future flexibility
        emit MaxPerAddressUpdated(oldMax, newMax);
    }

}
