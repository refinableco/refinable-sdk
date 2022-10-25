export interface IPrice {
  amount: number;
  address: string; // the address to the token
  decimals: number;
  priceInUSD?: number;
}
