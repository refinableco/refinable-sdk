import {
  Auction,
  AuctionExtended,
  BidderPot,
} from "@metaplex-foundation/mpl-auction";
import { AuctionManager, ClaimBid } from "@metaplex-foundation/mpl-metaplex";
import { Wallet } from "@metaplex/js";
import { Connection, PublicKey } from "@solana/web3.js";

interface IClaimBidParams {
  connection: Connection;
  wallet: Wallet;
  auction: PublicKey;
  store: PublicKey;
  bidderPotToken: PublicKey;
}

export const claimBid = async ({
  connection,
  wallet,
  store,
  auction,
  bidderPotToken,
}: IClaimBidParams) => {
  // get data for transactions
  const bidder = wallet.publicKey;
  const auctionManager = await AuctionManager.getPDA(auction);
  const manager = await AuctionManager.load(connection, auctionManager);
  const vault = new PublicKey(manager.data.vault);
  const {
    data: { tokenMint },
  } = await Auction.load(connection, auction);
  const acceptPayment = new PublicKey(manager.data.acceptPayment);
  const auctionExtended = await AuctionExtended.getPDA(vault);
  const auctionTokenMint = new PublicKey(tokenMint);
  const bidderPot = await BidderPot.getPDA(auction, bidder);
  ////

  const claimBidTransaction = new ClaimBid(
    { feePayer: bidder },
    {
      store,
      vault,
      auction,
      auctionExtended,
      auctionManager,
      bidder,
      tokenMint: auctionTokenMint,
      acceptPayment,
      bidderPot,
      bidderPotToken,
    }
  );

  return {
    instructions: claimBidTransaction.instructions,
    signers: [],
  };
};
