import FaucetManagerABI from '../out/FaucetManager.sol/FaucetManager.json';
import DevTokenABI from '../out/DevToken.sol/DevToken.json';
import DevNFTABI from '../out/DevNFT.sol/DevNFT.json';

export * from './types';
export * from './chains';

export const CONTRACTS_VERSION = '0.0.1';

export const ABIS = {
  FaucetManager: FaucetManagerABI.abi,
  DevToken: DevTokenABI.abi,
  DevNFT: DevNFTABI.abi,
} as const;

export interface DeploymentAddresses {
  network: string;
  deployer: string;
  admin: string;
  devToken: string;
  devNFT: string;
  faucetManager: string;
  deploymentTime: string;
}

let deploymentAddresses: Record<string, DeploymentAddresses> = {};

// Import deployment addresses dynamically
try {
  const liskSepoliaDeployment = require('./deployments/lisk-sepolia');
  if (liskSepoliaDeployment.DEPLOYMENT_ADDRESSES) {
    Object.assign(deploymentAddresses, liskSepoliaDeployment.DEPLOYMENT_ADDRESSES);
  }
} catch {
  // Deployment file not found
}

export function getDeploymentAddresses(network: string): DeploymentAddresses | undefined {
  return deploymentAddresses[network];
}

export function getAllDeploymentAddresses(): Record<string, DeploymentAddresses> {
  return deploymentAddresses;
}
