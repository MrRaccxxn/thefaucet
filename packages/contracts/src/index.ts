import FaucetManagerABI from "./abis/FaucetManager.json";
import DevTokenABI from "./abis/DevToken.json";
import DevNFTABI from "./abis/DevNFT.json";
import { DEPLOYMENT_ADDRESSES as liskSepoliaDeployments } from "./deployments/lisk-sepolia";

export * from "./types";
export * from "./chains";

export const CONTRACTS_VERSION = "0.0.1";

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
