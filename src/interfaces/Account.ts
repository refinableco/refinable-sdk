export interface Account {
  getTokenBalance(tokenAddress: string): Promise<string>;
  getBalance(): Promise<string>;
}
