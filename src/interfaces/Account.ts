export interface Account {
  getAddress(): Promise<string>
  getTokenBalance(tokenAddress: string): Promise<string>;
  getBalance(chainId?: number): Promise<string>;
}
