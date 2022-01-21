import { Wallet } from "@metaplex/js";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import {
  ExternalPriceAccount,
  MAX_EXTERNAL_ACCOUNT_SIZE,
  updateExternalPriceAccount,
} from "../oyster";
import { programIds, StringPublicKey, toPublicKey } from "../utils";

// This command creates the external pricing oracle
export async function createExternalPriceAccount(
  connection: Connection,
  wallet: Wallet
): Promise<{
  priceMint: StringPublicKey;
  externalPriceAccount: StringPublicKey;
  instructions: TransactionInstruction[];
  signers: Keypair[];
}> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const PROGRAM_IDS = programIds();

  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];

  const epaRentExempt = await connection.getMinimumBalanceForRentExemption(
    MAX_EXTERNAL_ACCOUNT_SIZE
  );

  const externalPriceAccount = Keypair.generate();
  const key = externalPriceAccount.publicKey.toBase58();

  const epaStruct = new ExternalPriceAccount({
    pricePerShare: new BN(0),
    priceMint: NATIVE_MINT.toBase58(),
    allowedToCombine: true,
  });

  const uninitializedEPA = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: externalPriceAccount.publicKey,
    lamports: epaRentExempt,
    space: MAX_EXTERNAL_ACCOUNT_SIZE,
    programId: toPublicKey(PROGRAM_IDS.vault),
  });
  instructions.push(uninitializedEPA);
  signers.push(externalPriceAccount);

  await updateExternalPriceAccount(key, epaStruct, instructions);

  return {
    externalPriceAccount: key,
    priceMint: NATIVE_MINT.toBase58(),
    instructions,
    signers,
  };
}
