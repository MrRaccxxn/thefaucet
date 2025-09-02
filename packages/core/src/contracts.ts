import { ABIS, type DeploymentAddresses, getDeploymentAddresses } from '@thefaucet/contracts';
import { createPublicClient, createWalletClient, http, type Address, type PublicClient, type WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { liskSepolia } from '@thefaucet/contracts/chains';

export interface FaucetContracts {
  faucetManager: Address;
  devToken: Address;
  devNFT: Address;
}

export function getContractAddresses(network: string): FaucetContracts | null {
  const deployment = getDeploymentAddresses(network);
  if (!deployment) return null;

  return {
    faucetManager: deployment.faucetManager as Address,
    devToken: deployment.devToken as Address,
    devNFT: deployment.devNFT as Address,
  };
}

export function createClients(network: string, rpcUrl: string, privateKey?: string) {
  const chain = network === 'lisk-sepolia' ? liskSepolia : sepolia;
  
  const publicClient: PublicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  let walletClient: WalletClient | undefined;
  if (privateKey) {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });
  }

  return { publicClient, walletClient };
}

export { ABIS };