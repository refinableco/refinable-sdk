import { Transaction } from "@metaplex-foundation/mpl-core";
import {
  InitVault,
  Vault,
  VaultProgram,
} from "@metaplex-foundation/mpl-token-vault";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { AccountLayout, MintLayout, NATIVE_MINT } from "@solana/spl-token";
import { Connection, Wallet } from "@metaplex/js";
import { TransactionsBatch } from "../../SOLNFT";
import { programs } from "@metaplex/js";
import { TxSets } from "../connection";

interface CreateVaultParams {
  connection: Connection;
  wallet: Wallet;
  priceMint: PublicKey;
  externalPriceAccount: PublicKey;
}

// This command creates the external pricing oracle a vault
// This gets the vault ready for adding the tokens.
export const createVault = async (
  {
    connection,
    wallet,
    priceMint = NATIVE_MINT,
    externalPriceAccount,
  }: CreateVaultParams,
  txSets: TxSets
) => {
  const accountRent = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );

  const mintRent = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span
  );

  const vaultRent = await connection.getMinimumBalanceForRentExemption(
    Vault.MAX_VAULT_SIZE
  );

  const vault = Keypair.generate();

  const vaultAuthority = await Vault.getPDA(vault.publicKey);

  const txBatch = new TransactionsBatch({ transactions: [] });

  const fractionMint = Keypair.generate();
  const fractionMintTx = new programs.CreateMint(
    { feePayer: wallet.publicKey },
    {
      newAccountPubkey: fractionMint.publicKey,
      lamports: mintRent,
      owner: vaultAuthority,
      freezeAuthority: vaultAuthority,
    }
  );
  txBatch.addTransaction(fractionMintTx);
  txBatch.addSigner(fractionMint);

  const redeemTreasury = Keypair.generate();
  const redeemTreasuryTx = new programs.CreateTokenAccount(
    { feePayer: wallet.publicKey },
    {
      newAccountPubkey: redeemTreasury.publicKey,
      lamports: accountRent,
      mint: priceMint,
      owner: vaultAuthority,
    }
  );
  txBatch.addTransaction(redeemTreasuryTx);
  txBatch.addSigner(redeemTreasury);

  const fractionTreasury = Keypair.generate();
  const fractionTreasuryTx = new programs.CreateTokenAccount(
    { feePayer: wallet.publicKey },
    {
      newAccountPubkey: fractionTreasury.publicKey,
      lamports: accountRent,
      mint: fractionMint.publicKey,
      owner: vaultAuthority,
    }
  );
  txBatch.addTransaction(fractionTreasuryTx);
  txBatch.addSigner(fractionTreasury);

  const uninitializedVaultTx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: vault.publicKey,
      lamports: vaultRent,
      space: Vault.MAX_VAULT_SIZE,
      programId: VaultProgram.PUBKEY,
    })
  );
  txBatch.addTransaction(uninitializedVaultTx);
  txBatch.addSigner(vault);

  const initVaultTx = new InitVault(
    { feePayer: wallet.publicKey },
    {
      vault: vault.publicKey,
      vaultAuthority: wallet.publicKey,
      fractionalTreasury: fractionTreasury.publicKey,
      pricingLookupAddress: externalPriceAccount,
      redeemTreasury: redeemTreasury.publicKey,
      fractionalMint: fractionMint.publicKey,
      allowFurtherShareCreation: true,
    }
  );
  txBatch.addTransaction(initVaultTx);


  // Save to array for batch sign
  txSets.instructions.push(txBatch.toInstructions());
  txSets.signers.push(txBatch.signers);

  return {
    vault: vault.publicKey,
    fractionMint: fractionMint.publicKey,
    redeemTreasury: redeemTreasury.publicKey,
    fractionTreasury: fractionTreasury.publicKey,
  };
};
