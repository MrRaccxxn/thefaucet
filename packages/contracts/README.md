# Faucet Smart Contracts

This package contains the smart contracts for the Faucet application, built with Foundry and Solidity. The contracts provide a comprehensive token distribution system with support for native tokens, ERC20 tokens, and NFTs.

## Overview

The faucet system consists of three main contracts:

1. **FaucetManager** - Central contract for managing token distribution with rate limiting and access control
2. **DevToken** - ERC20 token for testing purposes with minting and burning capabilities
3. **DevNFT** - ERC721 NFT collection for testing purposes with metadata support

## Features

### FaucetManager
- **Role-based access control** using OpenZeppelin's `AccessControl`
- **Rate limiting** with configurable cooldown periods
- **Whitelist/blacklist** functionality
- **Pausable** operations for emergency situations
- **Reentrancy protection** for security
- **Emergency withdrawal** functions
- **Multi-asset support** (native tokens, ERC20, NFTs)

### DevToken
- **ERC20 standard** compliance
- **Minting** functionality for authorized addresses
- **Burning** capabilities
- **Pausable** transfers
- **EIP-2612 permit** support for gasless approvals
- **Supply limits** to prevent inflation

### DevNFT
- **ERC721 standard** compliance
- **Minting** and batch minting
- **Metadata** support with custom URIs
- **Pausable** transfers
- **Supply limits** to prevent inflation

## Quick Start

### Prerequisites
- [Foundry](https://getfoundry.sh/) installed
- Node.js and npm/yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd thefaucet/packages/contracts
```

2. Install dependencies:
```bash
forge install
```

3. Build the contracts:
```bash
forge build
```

4. Run tests:
```bash
forge test
```

### Configuration

1. Set up environment variables:
```bash
export PRIVATE_KEY="your_private_key"
export ADMIN_ADDRESS="admin_address"
export NETWORK="sepolia"
export SEPOLIA_RPC_URL="your_sepolia_rpc_url"
export AMOY_RPC_URL="your_amoy_rpc_url"
export BSC_TESTNET_RPC_URL="your_bsc_testnet_rpc_url"
```

2. Configure the contracts in `foundry.toml`:
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
remappings = [
    "@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/",
    "@forge-std/=lib/forge-std/src/"
]
solc_version = "0.8.20"
optimizer = true
optimizer_runs = 200
via_ir = true
gas_reports = ["*"]
fuzz_runs = 1000
verbosity = 4
```

## Usage

### Deployment

#### Local Development
```bash
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

#### Test Networks
```bash
# Sepolia
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Amoy
forge script script/Deploy.s.sol --rpc-url $AMOY_RPC_URL --broadcast --verify

# BSC Testnet
forge script script/Deploy.s.sol --rpc-url $BSC_TESTNET_RPC_URL --broadcast --verify
```

### Testing

#### Run All Tests
```bash
forge test
```

#### Run Specific Test
```bash
forge test --match-contract BasicTest -v
```

#### Gas Report
```bash
forge test --gas-report
```

#### Coverage
```bash
forge coverage
```

### Verification

#### Manual Verification
Use the verification script to get constructor arguments:
```bash
forge script script/Verify.s.sol
```

#### Automatic Verification
Add `--verify` flag to deployment commands for automatic verification.

## Contract Interaction

### JavaScript/TypeScript Integration

The contracts include integration examples in the `examples/` directory:

- `faucet-integration.js` - JavaScript integration example
- `faucet-integration.ts` - TypeScript integration example

### Basic Usage Example

```javascript
const { FaucetIntegration } = require('./examples/faucet-integration');

// Initialize
const faucet = new FaucetIntegration(provider, signer);
await faucet.initializeContracts(faucetManagerAddress, devTokenAddress, devNFTAddress);

// Check if user can claim
const canClaim = await faucet.canClaimNativeTokens(userAddress);

// Claim tokens
if (canClaim) {
  await faucet.claimNativeTokens(userAddress);
}
```

### Contract Functions

#### FaucetManager
- `distributeNativeToken(address payable recipient)` - Distribute native tokens
- `distributeToken(address recipient, address tokenAddress, uint256 amount)` - Distribute ERC20 tokens
- `mintNFT(address recipient, address nftContract)` - Mint NFTs
- `updateCooldown(string assetType, uint256 newCooldown)` - Update cooldown periods
- `updateAmount(string assetType, uint256 newAmount)` - Update distribution amounts
- `setAddressStatus(address addr, bool whitelisted)` - Whitelist/blacklist addresses
- `setPaused(bool paused)` - Pause/unpause the contract

#### DevToken
- `mint(address to, uint256 amount)` - Mint tokens
- `burn(uint256 amount)` - Burn tokens
- `pause()` / `unpause()` - Pause/unpause transfers
- `getRemainingMintableSupply()` - Get remaining mintable supply

#### DevNFT
- `mint(address to)` - Mint NFT
- `batchMint(address[] recipients)` - Mint multiple NFTs
- `pause()` / `unpause()` - Pause/unpause transfers
- `totalSupply()` - Get total supply

## Configuration

### Default Values

#### FaucetManager
- Native token cooldown: 1 hour
- Token cooldown: 30 minutes
- NFT cooldown: 2 hours
- Native token amount: 0.01 ETH
- Default token amount: 100 tokens
- Max NFTs per user: 1

#### DevToken
- Name: "DevToken"
- Symbol: "DEV"
- Initial supply: 1,000,000 tokens
- Max supply: 10,000,000 tokens

#### DevNFT
- Name: "DevNFT"
- Symbol: "DNFT"
- Base URI: "https://api.example.com/nft/"
- Max supply: 10,000 NFTs

## Security Features

### Access Control
All contracts use OpenZeppelin's `AccessControl` for role-based permissions.

### Reentrancy Protection
The FaucetManager uses `ReentrancyGuard` to prevent reentrancy attacks.

### Pausable Operations
All contracts can be paused in emergency situations.

### Input Validation
All functions validate inputs to prevent invalid operations.

### Supply Limits
Tokens and NFTs have maximum supply limits to prevent inflation.

## Events

### FaucetManager Events
- `NativeTokenDistributed` - Emitted when native tokens are distributed
- `TokenDistributed` - Emitted when ERC20 tokens are distributed
- `NFTMinted` - Emitted when NFTs are minted
- `CooldownUpdated` - Emitted when cooldown periods are updated
- `AmountUpdated` - Emitted when distribution amounts are updated
- `AddressWhitelisted` - Emitted when addresses are whitelisted
- `AddressBlacklistedEvent` - Emitted when addresses are blacklisted
- `EmergencyWithdrawal` - Emitted during emergency withdrawals

### DevToken Events
- `TokensMinted` - Emitted when tokens are minted
- `TokensBurned` - Emitted when tokens are burned
- `MaxSupplyUpdated` - Emitted when max supply is updated

### DevNFT Events
- `NFTMinted` - Emitted when NFTs are minted
- `BaseURIUpdated` - Emitted when base URI is updated

## Error Handling

All contracts use custom errors for gas efficiency:

### FaucetManager Errors
- `InsufficientBalance` - Contract doesn't have enough balance
- `RateLimitExceeded` - User is trying to claim too frequently
- `AddressBlacklisted` - Address is blacklisted
- `AddressNotWhitelisted` - Address is not whitelisted
- `InvalidAmount` - Invalid amount provided
- `InvalidAddress` - Invalid address provided
- `NFTLimitExceeded` - User has reached NFT limit

### DevToken Errors
- `ExceedsMaxSupply` - Minting would exceed max supply
- `InvalidAmount` - Invalid amount provided
- `InvalidAddress` - Invalid address provided

### DevNFT Errors
- `ExceedsMaxSupply` - Minting would exceed max supply
- `InvalidAddress` - Invalid address provided
- `InvalidTokenId` - Invalid token ID provided

## Integration

### Frontend Integration
The contracts are designed to work with the frontend application. ABI files are generated in `../core/src/abi/` and TypeScript types are available in `../core/src/types/contracts.ts`.

### Backend Integration
The contracts can be integrated with backend services using the provided ABI files and TypeScript types.

## Monitoring

### Events
Monitor contract events for:
- Token distributions
- NFT mints
- Configuration changes
- Emergency operations

### Metrics
Track important metrics:
- Total tokens distributed
- Total NFTs minted
- Active users
- Gas usage

## Maintenance

### Regular Tasks
- Monitor contract balances
- Update cooldown periods as needed
- Review whitelist/blacklist
- Check for any suspicious activity

### Emergency Procedures
1. Pause contracts if needed
2. Use emergency withdrawal functions
3. Update access controls
4. Investigate and resolve issues

## Development

### Project Structure
```
packages/contracts/
├── src/                    # Contract source files
│   ├── FaucetManager.sol   # Main faucet contract
│   ├── DevToken.sol        # ERC20 token contract
│   └── DevNFT.sol          # ERC721 NFT contract
├── test/                   # Test files
│   ├── Basic.t.sol         # Basic functionality tests
│   └── FaucetManager.t.sol # Comprehensive tests
├── script/                 # Deployment scripts
│   ├── Deploy.s.sol        # Main deployment script
│   └── Verify.s.sol        # Verification script
├── examples/               # Integration examples
│   ├── faucet-integration.js
│   └── faucet-integration.ts
├── docs/                   # Documentation
│   └── README.md           # Detailed documentation
├── foundry.toml           # Foundry configuration
└── package.json           # Package configuration
```

### Adding New Features
1. Create feature branch
2. Implement changes in `src/`
3. Add tests in `test/`
4. Update documentation
5. Create pull request

### Code Style
- Follow Solidity style guide
- Use meaningful variable names
- Add comprehensive comments
- Include proper error handling
- Write thorough tests

## Support

For questions or issues:
1. Check the test files for usage examples
2. Review the contract source code
3. Check the deployment logs
4. Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details.
