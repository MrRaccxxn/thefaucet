import { http, createConfig, type Config } from 'wagmi'
import { sepolia, polygonAmoy, bscTestnet } from 'wagmi/chains'
import { liskSepolia } from '@thefaucet/contracts/chains'
import { 
  injected, 
  walletConnect, 
  coinbaseWallet 
} from '@wagmi/connectors'

// Configure chains for the app
export const chains = [
  sepolia,
  liskSepolia,
  polygonAmoy,
  bscTestnet,
] as const

// Function to create config (called only on client side)
function createWagmiConfig(): Config {
  return createConfig({
    chains,
    connectors: [
      injected(),
      walletConnect({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
        showQrModal: false,
        metadata: {
          name: 'The faucet',
          description: 'Multichain testnet faucet',
          url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          icons: [`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/favicon.ico`],
        },
      }),
      coinbaseWallet({
        appName: 'The faucet',
      }),
    ],
    transports: {
      [sepolia.id]: http(),
      [liskSepolia.id]: http(),
      [polygonAmoy.id]: http(),
      [bscTestnet.id]: http(),
    },
    ssr: true,
  })
}

// Export the config, but only create it if we're on the client side
export const config: Config = typeof window !== 'undefined' 
  ? createWagmiConfig() 
  : {} as Config

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
