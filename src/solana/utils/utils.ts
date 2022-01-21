import { MintInfo } from "@solana/spl-token";
import { TokenInfo } from "@solana/spl-token-registry";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { TokenAccount } from "../oyster";

export type KnownTokenMap = Map<string, TokenInfo>;

export const findProgramAddress = async (
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey
) => {
  const result = await PublicKey.findProgramAddress(seeds, programId);

  return [result[0].toBase58(), result[1]] as [string, number];
};

export function toLamports(
  account?: TokenAccount | number,
  mint?: MintInfo
): number {
  if (!account) {
    return 0;
  }

  const amount =
    typeof account === "number" ? account : account.info.amount?.toNumber();

  const precision = Math.pow(10, mint?.decimals || 0);
  return Math.floor(amount * precision);
}

export function fromLamports(
  account?: TokenAccount | number | BN,
  mint?: MintInfo,
  rate: number = 1.0
): number {
  if (!account) {
    return 0;
  }

  const amount = Math.floor(
    typeof account === "number"
      ? account
      : BN.isBN(account)
      ? account.toNumber()
      : account.info.amount.toNumber()
  );

  const precision = Math.pow(10, mint?.decimals || 9);
  return (amount / precision) * rate;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
