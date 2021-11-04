export enum Environment {
  Mainnet = "mainnet",
  Testnet = "testnet",
  Local = "local",
}

export interface RefinableOptions {
  waitConfirmations?: number;
  environment?: Environment;
}
