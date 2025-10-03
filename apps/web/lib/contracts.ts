import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ABIS, getDeploymentAddresses } from "@thefaucet/contract-artifacts";
import type { Address } from "viem";
import { useChainId } from "wagmi";

const CHAIN_NAMES: Record<number, string> = {
  11155111: "sepolia",
  4202: "lisk-sepolia",
  80002: "amoy",
  97: "bsc-testnet",
};

export function useContractAddresses() {
  const chainId = useChainId();
  const networkName = CHAIN_NAMES[chainId];

  if (!networkName) return null;

  const deployment = getDeploymentAddresses(networkName);

  if (!deployment) return null;

  return {
    faucetManager: deployment.faucetManager as Address,
    devToken: deployment.devToken as Address,
    devNFT: deployment.devNFT as Address,
  };
}

export function useFaucetManager() {
  const addresses = useContractAddresses();

  return {
    address: addresses?.faucetManager,
    abi: ABIS.FaucetManager,
  };
}

export function useDevToken() {
  const addresses = useContractAddresses();

  return {
    address: addresses?.devToken,
    abi: ABIS.DevToken,
  };
}

export function useDevNFT() {
  const addresses = useContractAddresses();

  return {
    address: addresses?.devNFT,
    abi: ABIS.DevNFT,
  };
}

// Faucet Manager hooks
export function useCanClaimNative(userAddress?: Address) {
  const { address, abi } = useFaucetManager();

  return useReadContract({
    address,
    abi,
    functionName: "canClaimNative",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(address && userAddress),
    },
  });
}

export function useNativeCooldown(userAddress?: Address) {
  const { address, abi } = useFaucetManager();

  return useReadContract({
    address,
    abi,
    functionName: "getNativeCooldown",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: Boolean(address && userAddress),
    },
  });
}

export function useNativeTokenAmount() {
  const { address, abi } = useFaucetManager();

  return useReadContract({
    address,
    abi,
    functionName: "nativeTokenAmount",
    query: {
      enabled: Boolean(address),
    },
  });
}

export function useClaimNativeToken() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address, abi } = useFaucetManager();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const claimNative = (recipient: Address) => {
    if (!address) throw new Error("Contract not available on this network");

    writeContract({
      address,
      abi,
      functionName: "claimNativeToken",
      args: [recipient],
    });
  };

  return {
    claimNative,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useClaimTokens() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address, abi } = useFaucetManager();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const claimTokens = (
    recipient: Address,
    tokenAddress: Address,
    amount: bigint
  ) => {
    if (!address) throw new Error("Contract not available on this network");

    writeContract({
      address,
      abi,
      functionName: "claimTokens",
      args: [recipient, tokenAddress, amount],
    });
  };

  return {
    claimTokens,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}

export function useClaimNFT() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { address, abi } = useFaucetManager();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const claimNFT = (recipient: Address, nftContract: Address) => {
    if (!address) throw new Error("Contract not available on this network");

    writeContract({
      address,
      abi,
      functionName: "claimNFT",
      args: [recipient, nftContract],
    });
  };

  return {
    claimNFT,
    hash,
    error,
    isPending,
    isConfirming,
    isConfirmed,
  };
}
