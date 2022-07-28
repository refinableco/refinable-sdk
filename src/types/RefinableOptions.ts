import type { Commitment } from "@solana/web3.js";

export enum Environment {
  Mainnet = "mainnet",
  Testnet = "testnet",
  Local = "local",
}

export type Options<T extends object> = RefinableOptions & T;

export interface RefinableOptions {
  environment?: Environment;
  headers?: Record<string, string>;
  evm?: RefinableEvmOptions;
  solana?: RefinableSolanaOptions;
}

export interface RefinableEvmOptions {
  gasSettings?: {
    maxPriceInGwei?: number; // Maximum gas price for transactions (default 300 gwei)
    speed?: "standard" | "fast" | "fastest"; // the tx speed setting: 'standard'|'fast|'fastest' (default: 'fastest')
  };
}
export interface RefinableSolanaOptions {
  commitment?: Commitment;
}
