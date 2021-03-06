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
  waitConfirmations?: number;
}
export interface RefinableSolanaOptions {
  commitment?: Commitment;
}
