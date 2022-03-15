import {
  AuctionExtended,
  BidderMetadata,
  BidderPot,
  CancelBid,
} from "@metaplex-foundation/mpl-auction";
import { Transaction } from "@metaplex-foundation/mpl-core";
import { AuctionManager } from "@metaplex-foundation/mpl-metaplex";
import { transactions, Wallet,utils } from "@metaplex/js";
import {
  AccountLayout,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { TransactionsBatch } from "../utils/TransactionsBatch";

interface ICancelBidParams {
  connection: Connection;
  wallet: Wallet;
  auction: PublicKey;
  bidderPotToken: PublicKey;
  destAccount?: PublicKey;
}

export const cancelBid = async ({
  connection,
  wallet,
  auction,
  bidderPotToken,
  destAccount,
}: ICancelBidParams) => {
  const bidder = wallet.publicKey;
  const auctionManager = await AuctionManager.getPDA(auction);
  const manager = await AuctionManager.load(connection, auctionManager);
  const {
    data: { tokenMint },
  } = await manager.getAuction(connection);

  const auctionTokenMint = new PublicKey(tokenMint);
  const vault = new PublicKey(manager.data.vault);
  const auctionExtended = await AuctionExtended.getPDA(vault);
  const bidderPot = await BidderPot.getPDA(auction, bidder);
  const bidderMeta = await BidderMetadata.getPDA(auction, bidder);

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );
  const txBatch = await getCancelBidTransactions({
    destAccount,
    bidder,
    accountRentExempt,
    bidderPot,
    bidderPotToken,
    bidderMeta,
    auction,
    auctionExtended,
    auctionTokenMint,
    vault,
  });

  return {
    instructions: txBatch.toInstructions(),
    signers: txBatch.signers,
  };
};

interface ICancelBidTransactionsParams {
  destAccount?: PublicKey;
  bidder: PublicKey;
  accountRentExempt: number;
  bidderPot: PublicKey;
  bidderPotToken: PublicKey;
  bidderMeta: PublicKey;
  auction: PublicKey;
  auctionExtended: PublicKey;
  auctionTokenMint: PublicKey;
  vault: PublicKey;
}

export const getCancelBidTransactions = async ({
  destAccount,
  bidder,
  accountRentExempt,
  bidderPot,
  bidderPotToken,
  bidderMeta,
  auction,
  auctionExtended,
  auctionTokenMint,
  vault,
}: ICancelBidTransactionsParams): Promise<TransactionsBatch> => {
  const txBatch = new TransactionsBatch({ transactions: [] });
  if (!destAccount) {
    const account = Keypair.generate();
    const createTokenAccountTransaction = new transactions.CreateTokenAccount(
      { feePayer: bidder },
      {
        newAccountPubkey: account.publicKey,
        lamports: accountRentExempt,
        mint: NATIVE_MINT,
      }
    );
    const closeTokenAccountInstruction = new Transaction().add(
      Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        account.publicKey,
        bidder,
        bidder,
        []
      )
    );
    txBatch.addTransaction(createTokenAccountTransaction);
    txBatch.addAfterTransaction(closeTokenAccountInstruction);
    txBatch.addSigner(account);
    destAccount = account.publicKey;
  }

  const cancelBidTransaction = new CancelBid(
    { feePayer: bidder },
    {
      bidder,
      bidderToken: destAccount,
      bidderPot,
      bidderPotToken,
      bidderMeta,
      auction,
      auctionExtended,
      tokenMint: auctionTokenMint,
      resource: vault,
    }
  );
  txBatch.addTransaction(cancelBidTransaction);

  return txBatch;
};
