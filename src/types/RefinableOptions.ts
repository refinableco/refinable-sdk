export enum Environment {
  Mainnet = "mainnet",
  Testnet = "testnet",
}

export interface RefinableOptions {
  waitConfirmations?: number;
  environment?: Environment;
}
