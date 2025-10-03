import { FaucetManagerABI } from "./abis/FaucetManager.js";
import { DevTokenABI } from "./abis/DevToken.js";
import { DevNFTABI } from "./abis/DevNFT.js";
import { DEPLOYMENT_ADDRESSES as liskSepoliaDeployments } from "./deployments/lisk-sepolia.js";

export * from "./types.js";
export * from "./chains.js";

// Re-export ABIs for direct access
export { FaucetManagerABI, DevTokenABI, DevNFTABI };

export const CONTRACTS_VERSION = "0.0.1";

// Export ABIs object with proper const assertion for Wagmi type inference
export const ABIS = {
  FaucetManager: FaucetManagerABI,
  DevToken: DevTokenABI,
  DevNFT: DevNFTABI,
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

const deploymentAddresses: Record<string, DeploymentAddresses> = {
  ...liskSepoliaDeployments,
};

export function getDeploymentAddresses(
  network: string
): DeploymentAddresses | undefined {
  return deploymentAddresses[network];
}

export function getAllDeploymentAddresses(): Record<
  string,
  DeploymentAddresses
> {
  return deploymentAddresses;
}

