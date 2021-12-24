import { Connection, programs, Wallet } from "@metaplex/js";

import { StringPublicKey, Transaction } from "@metaplex-foundation/mpl-core";
import { PublicKey, TransactionSignature } from "@solana/web3.js";
import {
  Auction,
  AuctionExtended,
  CreateAuction,
  CreateAuctionArgs,
  PriceFloor,
  WinnerLimit,
} from "@metaplex-foundation/mpl-auction";
import BN from "bn.js";
import { TxSets } from "../connection";
import { TransactionsBatch } from "../../SOLNFT";

//TODO: move to mpl
export interface IPartialCreateAuctionArgs {
  /// How many winners are allowed for this auction. See AuctionData.
  winners: WinnerLimit;
  /// End time is the cut-off point that the auction is forced to end by. See AuctionData.
  endAuctionAt: BN | null;
  /// Gap time is how much time after the previous bid where the auction ends. See AuctionData.
  auctionGap: BN | null;
  /// Token mint for the SPL token used for bidding.
  tokenMint: StringPublicKey;

  priceFloor: PriceFloor;

  tickSize: BN | null;

  gapTickSizePercentage: number | null;

  instantSalePrice: BN | null;

  name: number[] | null;
}

interface MakeAuctionParams {
  connection: Connection;
  wallet: Wallet;
  vault: PublicKey;
  auctionSettings: IPartialCreateAuctionArgs;
}

interface MakeAuctionResponse {
  auction: PublicKey;
}

// This command makes an auction
export const makeAuction = async (
  { connection, wallet, vault, auctionSettings }: MakeAuctionParams,
  txSets: TxSets
): Promise<MakeAuctionResponse> => {
  const txOptions = { feePayer: wallet.publicKey };
  const auctionKey = await Auction.getPDA(vault);

  const txBatch = new TransactionsBatch({ transactions: [] });

  const fullSettings = new CreateAuctionArgs({
    ...auctionSettings,
    authority: wallet.publicKey.toBase58(),
    resource: vault.toBase58(),
  });

  console.log(CreateAuction);

  const auctionTx: Transaction = new CreateAuction(txOptions, {
    args: fullSettings,
    auction: auctionKey,
    creator: wallet.publicKey,
    auctionExtended: await AuctionExtended.getPDA(vault),
  });

  txBatch.addTransaction(auctionTx);

  // Save to array for batch sign
  txSets.instructions.push(txBatch.toInstructions());
  txSets.signers.push(txBatch.signers);

  return {
    auction: auctionKey,
  };
};
