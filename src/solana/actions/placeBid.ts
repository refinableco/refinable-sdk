import {
  AuctionExtended,
  BidderMetadata,
  BidderPot,
  PlaceBid,
} from "@metaplex-foundation/mpl-auction";
import { AuctionManager } from "@metaplex-foundation/mpl-metaplex";
import { Wallet } from "@metaplex/js";
import { AccountLayout, NATIVE_MINT } from "@solana/spl-token";
import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import { approve, AUCTION_PREFIX, createTokenAccount } from "../oyster";
import { AUCTION_ID, findProgramAddress, toPublicKey } from "../utils";
import { TransactionsBatch } from "../utils/TransactionsBatch";
import { getCancelBidTransactions } from "./cancelBid";

interface IPlaceBidParams {
  connection: Connection;
  wallet: Wallet;
  auction: PublicKey;
  bidderPotToken?: PublicKey;
  // amount in lamports
  amount: BN;
  commitment?: Commitment;
}

export const placeBid = async ({
  connection,
  wallet,
  amount,
  auction,
  bidderPotToken,
}: IPlaceBidParams) => {
  // get data for transactions
  const bidder = wallet.publicKey;
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );
  const auctionManager = await AuctionManager.getPDA(auction);
  const manager = await AuctionManager.load(connection, auctionManager);
  const { data: auctionData, pubkey: auctionPubKey } = await manager.getAuction(
    connection
  );
  const auctionTokenMint = new PublicKey(auctionData.tokenMint);
  const vault = new PublicKey(manager.data.vault);
  const auctionExtended = await AuctionExtended.getPDA(vault);
  const bidderPot = await BidderPot.getPDA(auction, bidder);
  const bidderMeta = await BidderMetadata.getPDA(auction, bidder);
  ////

  let txBatch = new TransactionsBatch({ transactions: [] });

  const instructions: TransactionInstruction[] = [];
  const signers: Keypair[] = [];
  const cleanupInstructions: TransactionInstruction[] = [];

  if (bidderPotToken) {
    // cancel prev bid
    txBatch = await getCancelBidTransactions({
      destAccount: null,
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

    instructions.push(...txBatch.toInstructions());
    signers.push(...txBatch.signers);
    ////
  } else {
    bidderPotToken = toPublicKey(
      (
        await findProgramAddress(
          [
            Buffer.from(AUCTION_PREFIX),
            toPublicKey(bidderPot).toBuffer(),
            Buffer.from("bidder_pot_token"),
          ],
          toPublicKey(AUCTION_ID)
        )
      )[0]
    );
    ////
  }

  // create paying account

  const payingTokenAccount = createTokenAccount(
    instructions,
    bidder,
    amount.toNumber() + accountRentExempt * 2,
    toPublicKey(NATIVE_MINT),
    bidder,
    signers
  );
  ////

  // transfer authority
  const transferAuthority = approve(
    instructions,
    cleanupInstructions,
    payingTokenAccount,
    bidder,
    amount.toNumber()
  );

  signers.push(transferAuthority);
  ////

  // create place bid transaction
  const placeBidTransaction = new PlaceBid(
    { feePayer: bidder },
    {
      bidder,
      bidderToken: payingTokenAccount,
      bidderPot,
      bidderPotToken,
      bidderMeta,
      auction,
      auctionExtended,
      tokenMint: auctionTokenMint,
      transferAuthority: transferAuthority.publicKey,
      amount,
      resource: vault,
    }
  );
  instructions.push(
    ...placeBidTransaction.instructions,
    ...cleanupInstructions
  );
  ////

  return { bidderPotToken, bidderMeta, instructions, signers };
};
