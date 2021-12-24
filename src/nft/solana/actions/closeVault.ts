import {
  ActivateVault,
  CombineVault,
  Vault,
} from "@metaplex-foundation/mpl-token-vault";
import { Keypair, PublicKey } from "@solana/web3.js";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import { Transaction } from "@metaplex-foundation/mpl-core";
import { Connection, programs, Wallet } from "@metaplex/js";
import { TransactionsBatch } from "../../SOLNFT";
import { TxSets } from "../connection";

interface CloseVaultParams {
  connection: Connection;
  wallet: Wallet;
  vault: PublicKey;
  fractionMint: PublicKey;
  fractionTreasury: PublicKey;
  redeemTreasury: PublicKey;
  priceMint: PublicKey;
  externalPriceAccount: PublicKey;
}

// This command "closes" the vault, by activating & combining it in one go, handing it over to the auction manager
// authority (that may or may not exist yet.)
export const closeVault = async (
  {
    connection,
    wallet,
    vault,
    priceMint,
    fractionMint,
    fractionTreasury,
    redeemTreasury,
    externalPriceAccount,
  }: CloseVaultParams,
  txSets: TxSets
) => {
  const accountRent = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );

  const fractionMintAuthority = await Vault.getPDA(vault);

  const txBatch = new TransactionsBatch({ transactions: [] });

  const txOptions = { feePayer: wallet.publicKey };

  console.log("load vault");

  console.log("loaded vault");

  const activateVaultTx = new ActivateVault(txOptions, {
    vault,
    numberOfShares: new BN(0),
    fractionMint,
    fractionTreasury,
    fractionMintAuthority,
    vaultAuthority: wallet.publicKey,
  });
  txBatch.addTransaction(activateVaultTx);

  const outstandingShareAccount = Keypair.generate();
  const outstandingShareAccountTx = new programs.CreateTokenAccount(txOptions, {
    newAccountPubkey: outstandingShareAccount.publicKey,
    lamports: accountRent,
    mint: redeemTreasury,
    owner: wallet.publicKey,
  });
  txBatch.addTransaction(outstandingShareAccountTx);
  txBatch.addSigner(outstandingShareAccount);

  const payingTokenAccount = Keypair.generate();
  const payingTokenAccountTx = new programs.CreateTokenAccount(txOptions, {
    newAccountPubkey: payingTokenAccount.publicKey,
    lamports: accountRent,
    mint: priceMint,
    owner: wallet.publicKey,
  });
  txBatch.addTransaction(payingTokenAccountTx);
  txBatch.addSigner(payingTokenAccount);

  const transferAuthority = Keypair.generate();

  const createApproveTx = (account: Keypair) =>
    new Transaction().add(
      Token.createApproveInstruction(
        TOKEN_PROGRAM_ID,
        account.publicKey,
        transferAuthority.publicKey,
        wallet.publicKey,
        [],
        0
      )
    );

  txBatch.addTransaction(createApproveTx(payingTokenAccount));
  txBatch.addTransaction(createApproveTx(outstandingShareAccount));
  txBatch.addSigner(transferAuthority);

  const combineVaultTx = new CombineVault(txOptions, {
    vault,
    outstandingShareTokenAccount: outstandingShareAccount.publicKey,
    payingTokenAccount: payingTokenAccount.publicKey,
    fractionMint,
    fractionTreasury,
    redeemTreasury,
    burnAuthority: fractionMintAuthority,
    externalPriceAccount: externalPriceAccount,
    transferAuthority: transferAuthority.publicKey,
    vaultAuthority: wallet.publicKey,
    newVaultAuthority: wallet.publicKey,
  });
  txBatch.addTransaction(combineVaultTx);

  // Save to array for batch sign
  txSets.instructions.push(txBatch.toInstructions());
  txSets.signers.push(txBatch.signers);
};
