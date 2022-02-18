export interface Account {
  getTokenBalance(tokenAddress: string): Promise<string>;
  getBalance(chainId?: number): Promise<string>;
}
