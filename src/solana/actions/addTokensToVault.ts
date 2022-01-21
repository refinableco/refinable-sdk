import { Wallet } from "@metaplex/js";
import { AccountLayout } from "@solana/spl-token";
import { Connection, Keypair, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import {
  addTokenToInactiveVault,
  approve,
  createTokenAccount,
  MetadataKey,
  SafetyDepositConfig,
  VAULT_PREFIX,
} from "../oyster";
import {
  findProgramAddress,
  programIds,
  StringPublicKey,
  toPublicKey,
} from "../utils";
import { SafetyDepositDraft } from "./createAuctionManager";

export interface SafetyDepositInstructionTemplate {
  box: {
    tokenAccount?: StringPublicKey;
    tokenMint: StringPublicKey;
    amount: BN;
  };
  draft: SafetyDepositDraft;
  config: SafetyDepositConfig;
}

const BATCH_SIZE = 1;
// This command batches out adding tokens to a vault using a prefilled payer account, and then activates and combines
// the vault for use. It issues a series of transaction instructions and signers for the sendTransactions batch.
export async function addTokensToVault(
  connection: Connection,
  wallet: Wallet,
  vault: StringPublicKey,
  nfts: SafetyDepositInstructionTemplate[]
): Promise<{
  instructions: Array<TransactionInstruction[]>;
  signers: Array<Keypair[]>;
  safetyDepositTokenStores: StringPublicKey[];
}> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const PROGRAM_IDS = programIds();

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );

  const vaultAuthority = (
    await findProgramAddress(
      [
        Buffer.from(VAULT_PREFIX),
        toPublicKey(PROGRAM_IDS.vault).toBuffer(),
        toPublicKey(vault).toBuffer(),
      ],
      toPublicKey(PROGRAM_IDS.vault)
    )
  )[0];

  let batchCounter = 0;

  const signers: Array<Keypair[]> = [];
  const instructions: Array<TransactionInstruction[]> = [];
  const newStores: StringPublicKey[] = [];

  let currSigners: Keypair[] = [];
  let currInstructions: TransactionInstruction[] = [];
  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    if (nft.box.tokenAccount) {
      const newStoreAccount = createTokenAccount(
        currInstructions,
        wallet.publicKey,
        accountRentExempt,
        toPublicKey(nft.box.tokenMint),
        toPublicKey(vaultAuthority),
        currSigners
      );
      newStores.push(newStoreAccount.toBase58());

      const transferAuthority = approve(
        currInstructions,
        [],
        toPublicKey(nft.box.tokenAccount),
        wallet.publicKey,
        nft.box.amount.toNumber()
      );

      currSigners.push(transferAuthority);

      await addTokenToInactiveVault(
        nft.draft.masterEdition &&
          nft.draft.masterEdition.data.key === MetadataKey.MasterEditionV2
          ? new BN(1)
          : nft.box.amount,
        nft.box.tokenMint,
        nft.box.tokenAccount,
        newStoreAccount.toBase58(),
        vault,
        wallet.publicKey.toBase58(),
        wallet.publicKey.toBase58(),
        transferAuthority.publicKey.toBase58(),
        currInstructions
      );

      if (batchCounter === BATCH_SIZE) {
        signers.push(currSigners);
        instructions.push(currInstructions);
        batchCounter = 0;
        currSigners = [];
        currInstructions = [];
      }
      batchCounter++;
    }
  }

  if (instructions[instructions.length - 1] !== currInstructions) {
    signers.push(currSigners);
    instructions.push(currInstructions);
  }

  return { signers, instructions, safetyDepositTokenStores: newStores };
}
