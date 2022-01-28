import { TokenAccount } from "@metaplex-foundation/mpl-core";
import { MintInfo } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

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
    typeof account === "number" ? account : account.data.amount?.toNumber();

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
      : account.data.amount.toNumber()
  );

  const precision = Math.pow(10, mint?.decimals || 9);
  return (amount / precision) * rate;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
