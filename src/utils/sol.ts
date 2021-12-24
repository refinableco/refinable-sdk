import { TokenAccount } from "@metaplex-foundation/mpl-core";

export function toLamports(
  account?: TokenAccount | number,
  mint?: { decimals: number }
): number {
  if (!account) {
    return 0;
  }

  const amount =
    typeof account === "number" ? account : account.data.amount?.toNumber();

  const precision = Math.pow(10, mint?.decimals || 0);
  return Math.floor(amount * precision);
}
