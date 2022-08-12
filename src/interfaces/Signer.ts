import type { providers, Signer, Wallet } from "ethers";
import { Account } from "./Account";

export interface AccountSigner extends Account {
  sign(message: string): Promise<string>;
}

export type ProviderSignerWallet =
  | providers.Networkish
  | Signer
  | providers.Provider
  | Wallet;

export type KindaSigner = providers.JsonRpcSigner | Wallet;
