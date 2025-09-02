import { sepolia, polygonAmoy, bscTestnet } from 'wagmi/chains'

export interface NetworkConfig {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
  iconUrls?: string[]
}

export const networkConfigs: Record<number, NetworkConfig> = {
  [sepolia.id]: {
    chainId: `0x${sepolia.id.toString(16)}`,
    chainName: 'Ethereum Sepolia',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    iconUrls: ['https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/6ed5f/eth-diamond-black.png'],
  },
  [polygonAmoy.id]: {
    chainId: `0x${polygonAmoy.id.toString(16)}`,
    chainName: 'Polygon Amoy',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    blockExplorerUrls: ['https://www.oklink.com/amoy'],
    iconUrls: ['https://polygon.technology/static/images/polygon-logo.png'],
  },
  [bscTestnet.id]: {
    chainId: `0x${bscTestnet.id.toString(16)}`,
    chainName: 'BSC Testnet',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'tBNB',
      decimals: 18,
    },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
    iconUrls: ['https://binance.com/static/images/common/favicon.ico'],
  },
}

export async function addNetworkToWallet(chainId: number): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed')
  }

  const config = networkConfigs[chainId]
  if (!config) {
    throw new Error(`Network configuration not found for chain ID ${chainId}`)
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [config],
    })
    return true
  } catch (error) {
    console.error('Failed to add network:', error)
    return false
  }
}

export async function switchNetworkInWallet(chainId: number): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask is not installed')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    })
    return true
  } catch (error: any) {
    // If the network is not added, try to add it
    if (error.code === 4902) {
      return await addNetworkToWallet(chainId)
    }
    console.error('Failed to switch network:', error)
    return false
  }
}
