import type { AnyPublicKey, TokenAccount } from "@metaplex-foundation/mpl-core";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { Connection, TransactionInstruction } from "@solana/web3.js";
import { toPublicKey } from "../solana/utils";

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

export async function getOrCreateAssociatedAccountInfo(
  connection: Connection,
  payer: AnyPublicKey,
  mint: AnyPublicKey,
  owner: AnyPublicKey,
  instructions: TransactionInstruction[]
) {
  const associatedDestinationTokenAddr = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    toPublicKey(mint),
    toPublicKey(owner)
  );

  const receiverAccount = await connection.getAccountInfo(
    associatedDestinationTokenAddr
  );

  if (receiverAccount === null) {
    instructions.push(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        toPublicKey(mint),
        associatedDestinationTokenAddr,
        toPublicKey(owner),
        toPublicKey(payer)
      )
    );
  }

  return associatedDestinationTokenAddr;
}
