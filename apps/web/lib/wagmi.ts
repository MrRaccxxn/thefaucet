import { http, createConfig, type Config } from 'wagmi'
import { sepolia, polygonAmoy, bscTestnet } from 'wagmi/chains'
import { 
  injected, 
  walletConnect, 
  coinbaseWallet 
} from '@wagmi/connectors'

// Configure chains for the app
export const chains = [
  sepolia,
  polygonAmoy,
  bscTestnet,
] as const

// Configure your wagmi config
export const config: Config = createConfig({
  chains,
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
    }),
    coinbaseWallet({
      appName: 'The Faucet',
    }),
  ],
  transports: {
    [sepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [bscTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
