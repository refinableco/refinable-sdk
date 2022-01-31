import { Auction, AuctionExtended } from "@metaplex-foundation/mpl-auction";
import { Transaction } from "@metaplex-foundation/mpl-core";
import {
  AuctionManager,
  SafetyDepositConfig,
} from "@metaplex-foundation/mpl-metaplex";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Vault } from "@metaplex-foundation/mpl-token-vault";
import { actions, Wallet } from "@metaplex/js";
import { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { sendTransactions, SequenceType } from "../../nft/solana/connection";
import { getOrCreateAssociatedAccountInfo } from "../../utils/sol";
import { redeemFullRightsTransferBid } from "../oyster";
import { toPublicKey } from "../utils";
import { cancelBid } from "./cancelBid";
import { claimBid } from "./claimBid";
import { placeBid } from "./placeBid";

interface IInstantSaleParams {
  connection: Connection;
  wallet: Wallet;
  auction: PublicKey;
  store: PublicKey;
}

export const instantSale = async ({
  connection,
  wallet,
  store,
  auction,
}: IInstantSaleParams) => {
  // get data for transactions
  const auctionManagerPDA = await AuctionManager.getPDA(auction);
  const manager = await AuctionManager.load(connection, auctionManagerPDA);
  const vault = await Vault.load(connection, manager.data.vault);
  const auctionExtendedPDA = await AuctionExtended.getPDA(vault.pubkey);
  const {
    data: { instantSalePrice },
  } = await AuctionExtended.load(connection, auctionExtendedPDA);
  const [safetyDepositBox] = await vault.getSafetyDepositBoxes(connection);
  const metadata = await Metadata.getPDA(safetyDepositBox.data.tokenMint);
  const safetyDepositConfigPDA = await SafetyDepositConfig.getPDA(
    auctionManagerPDA,
    safetyDepositBox.pubkey
  );
  const {
    data: { winningConfigType, participationConfig },
  } = await SafetyDepositConfig.load(connection, safetyDepositConfigPDA);
  ////

  const {
    bidderPotToken,
    instructions: placeBidInstructions,
    signers: placeBidSigners,
  } = await placeBid({
    connection,
    wallet,
    amount: instantSalePrice,
    auction,
  });

  const txId = await actions.sendTransaction({
    connection,
    wallet,
    txs: [new Transaction().add(...placeBidInstructions)],
    signers: placeBidSigners,
  });

  // wait for all accounts to be created
  await connection.confirmTransaction(txId, "finalized");

  const {
    data: { bidState },
  } = await Auction.load(connection, auction);
  const winIndex = bidState.getWinnerIndex(wallet.publicKey.toBase58());
  const hasWinner = winIndex !== null;

  const redeemInstructions: TransactionInstruction[] = [];

  let cancelOrClaimBidInstructions = [];
  let cancelOrClaimBidSigners = [];

  // NOTE: it's divided into several transactions since transaction size is restricted
  if (hasWinner) {
    const destinationTokenAccount = await getOrCreateAssociatedAccountInfo(
      connection,
      wallet.publicKey,
      toPublicKey(safetyDepositBox.data.tokenMint),
      wallet.publicKey,
      redeemInstructions
    );

    await redeemFullRightsTransferBid(
      manager.data.vault,
      manager.data.store,
      safetyDepositBox.data.store,
      destinationTokenAccount.toBase58(),
      safetyDepositBox.pubkey.toBase58(),
      vault.data.fractionMint,
      wallet.publicKey.toBase58(),
      wallet.publicKey.toBase58(),
      redeemInstructions,
      metadata.toBase58(),
      wallet.publicKey.toBase58()
    );

    ({
      instructions: cancelOrClaimBidInstructions,
      signers: cancelOrClaimBidSigners,
    } = await claimBid({
      connection,
      wallet,
      store,
      auction,
      bidderPotToken,
    }));
  } else {
    // if user didn't win, user must have a bid we can refund before we check for open editions
    ({
      instructions: cancelOrClaimBidInstructions,
      signers: cancelOrClaimBidSigners,
    } = await cancelBid({
      connection,
      wallet,
      auction,
      bidderPotToken,
    }));
  }

  const instructions = [redeemInstructions, cancelOrClaimBidInstructions];

  const signers = [[], cancelOrClaimBidSigners];

  // TODO: make sendTx return txId
  return sendTransactions(
    connection,
    wallet,
    instructions,
    signers,
    SequenceType.StopOnFailure,
    "single"
  );
};
