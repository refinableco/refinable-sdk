import type { providers, Signer, Wallet } from "ethers";
import { Account } from "./Account";

export interface EIP712 {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: any;
  value: any;
}

export const isEIP712 = (message: string | EIP712): message is EIP712 =>
  !!(message as EIP712)?.domain;

export interface AccountSigner extends Account {
  sign(message: string | EIP712): Promise<string>;
}

export type ProviderSignerWallet =
  | providers.Networkish
  | Signer
  | providers.Provider
  | Wallet;

export type KindaSigner = providers.JsonRpcSigner | Wallet;
