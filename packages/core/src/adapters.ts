// Chain adapter interfaces and implementations
// This will be implemented in Task 8: Implement Chain Adapter Interface and EVM Implementation

export interface ChainAdapter {
  getNativeBalance(faucet: string): Promise<bigint>;
  getTokenBalance(faucet: string, token: string): Promise<bigint>;
  sendNative(to: string, amount: bigint): Promise<string>;
  sendToken(to: string, token: string, amount: bigint): Promise<string>;
  mintNFT(to: string, nft: string, count: number): Promise<string>;
}

// Placeholder implementation - will be replaced with actual EVM adapter
export class EVMAdapter implements ChainAdapter {
  async getNativeBalance(faucet: string): Promise<bigint> {
    throw new Error('Not implemented - will be implemented in Task 8');
  }

  async getTokenBalance(faucet: string, token: string): Promise<bigint> {
    throw new Error('Not implemented - will be implemented in Task 8');
  }

  async sendNative(to: string, amount: bigint): Promise<string> {
    throw new Error('Not implemented - will be implemented in Task 8');
  }

  async sendToken(to: string, token: string, amount: bigint): Promise<string> {
    throw new Error('Not implemented - will be implemented in Task 8');
  }

  async mintNFT(to: string, nft: string, count: number): Promise<string> {
    throw new Error('Not implemented - will be implemented in Task 8');
  }
}
