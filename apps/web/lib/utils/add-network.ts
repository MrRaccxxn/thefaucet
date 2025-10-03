import { sepolia, polygonAmoy, bscTestnet } from 'wagmi/chains';
import { liskSepolia } from '@thefaucet/contract-artifacts/chains';

export async function addNetworkToWallet(chainId: number) {
  if (!window.ethereum) {
    throw new Error('No wallet found');
  }

  // Get the chain configuration
  let chain;
  switch (chainId) {
    case 11155111: // Sepolia
      chain = sepolia;
      break;
    case 80002: // Polygon Amoy
      chain = polygonAmoy;
      break;
    case 97: // BSC Testnet
      chain = bscTestnet;
      break;
    case 4202: // Lisk Sepolia
      chain = liskSepolia;
      break;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  try {
    // Try to switch to the network first
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        // Add the network
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${chainId.toString(16)}`,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: chain.rpcUrls.default.http,
              blockExplorerUrls: chain.blockExplorers?.default.url ? [chain.blockExplorers.default.url] : [],
            },
          ],
        });
      } catch (addError) {
        throw new Error('Failed to add network');
      }
    } else {
      throw switchError;
    }
  }
}