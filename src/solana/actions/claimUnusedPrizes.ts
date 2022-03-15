import {
  Auction,
  AuctionExtended,
  BidderMetadata,
} from "@metaplex-foundation/mpl-auction";
import { TokenAccount } from "@metaplex-foundation/mpl-core";
import {
  AuctionManager,
  BidRedemptionTicket,
  ParticipationConfigV2,
  SafetyDepositConfig,
  WinningConfigType,
} from "@metaplex-foundation/mpl-metaplex";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { SafetyDepositBox, Vault } from "@metaplex-foundation/mpl-token-vault";
import { actions as mpActions, Wallet } from "@metaplex/js";
import { AccountLayout, Token } from "@solana/spl-token";
import { Connection, Keypair, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { getOrCreateAssociatedAccountInfo } from "../../utils/sol";
import {
  createTokenAccount,
  redeemBid,
  redeemFullRightsTransferBid,
} from "../oyster";
import { toPublicKey } from "../utils";

interface AuctionView {
  vault: Vault;
  auction: Auction;
  auctionExt: AuctionExtended;
  auctionManager: AuctionManager;
  participationConfig: ParticipationConfigV2;
  safetyDeposit: SafetyDepositBox;
}

export async function claimUnusedPrizes(
  connection: Connection,
  storePubKey: string,
  wallet: Wallet,
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
  signers: Array<Keypair[]>,
  instructions: Array<TransactionInstruction[]>
) {
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span
  );

  console.log({
    bidStateMax: auctionView.auction.data.bidState.max.toNumber(),
  });

  for (
    let winnerIndex = 0;
    winnerIndex < auctionView.auction.data.bidState.max.toNumber();
    winnerIndex++
  ) {
    // const winningSet = auctionView.items[winnerIndex];
    const winningSet = [
      {
        safetyDeposit: auctionView.safetyDeposit,
        participationConfig: auctionView.participationConfig,
      },
    ];

    for (let i = 0; i < winningSet.length; i++) {
      const item = winningSet[i];

      const safetyDeposit = item.safetyDeposit;
      const safetyDepositConfig = await SafetyDepositConfig.getPDA(
        auctionView.auctionManager.pubkey,
        auctionView.safetyDeposit.pubkey
      );
      const config = await SafetyDepositConfig.load(
        connection,
        safetyDepositConfig
      );

      const tokenBalance = await connection.getTokenAccountBalance(
        toPublicKey(safetyDeposit.data.store)
      );
      // If box is empty, we cant redeem this. Could be broken AM we are claiming against.
      if (tokenBalance.value.uiAmount === 0) {
        console.log("Skipping", i, " due to empty balance");
        continue;
      }
      if (
        winnerIndex < auctionView.auction.data.bidState.bids.length &&
        config.data.winningConfigType != WinningConfigType.PrintingV2
      ) {
        console.log("continue", {
          bidState: winnerIndex < auctionView.auction.data.bidState.bids.length,
          configData: config.data,
        });
        continue;
      }

      const bidRedemptionTickets =
        await auctionView.auctionManager.getBidRedemptionTickets(
          connection,
          true
        );

      console.log({ bidRedemptionTickets, sdcd: config.data });

      switch (config.data.winningConfigType) {
        case WinningConfigType.FullRightsTransfer:
          console.log("Redeeming Full Rights");
          await setupRedeemFullRightsTransferInstructions(
            connection,
            auctionView,
            accountRentExempt,
            wallet,
            safetyDeposit,
            signers,
            instructions,
            winnerIndex,
            bidRedemptionTickets
          );
          break;
        case WinningConfigType.TokenOnlyTransfer:
          console.log("Redeeming Token only");
          await setupRedeemInstructions(
            storePubKey,
            auctionView,
            accountsByMint,
            accountRentExempt,
            wallet,
            safetyDeposit,
            signers,
            instructions,
            winnerIndex,
            bidRedemptionTickets
          );
          break;
      }
    }
  }
}

async function setupRedeemInstructions(
  storePubKey: string,
  auctionView: AuctionView,
  accountsByMint: Map<string, TokenAccount>,
  accountRentExempt: number,
  wallet: Wallet,
  safetyDeposit: SafetyDepositBox,
  signers: Array<Keypair[]>,
  instructions: Array<TransactionInstruction[]>,
  winningConfigIndex: number,
  bidRedemptionTickets: BidRedemptionTicket[]
) {
  const winningPrizeSigner: Keypair[] = [];
  const winningPrizeInstructions: TransactionInstruction[] = [];

  signers.push(winningPrizeSigner);
  instructions.push(winningPrizeInstructions);
  const claimed = isItemClaimed(
    bidRedemptionTickets,
    winningConfigIndex,
    safetyDeposit.data.order
  );

  if (!claimed) {
    let newTokenAccount = accountsByMint
      .get(safetyDeposit.data.tokenMint)
      ?.pubkey.toBase58();
    if (!newTokenAccount)
      newTokenAccount = createTokenAccount(
        winningPrizeInstructions,
        wallet.publicKey,
        accountRentExempt,
        toPublicKey(safetyDeposit.data.tokenMint),
        wallet.publicKey,
        winningPrizeSigner
      ).toBase58();

    await redeemBid(
      auctionView.auctionManager.data.vault,
      storePubKey,
      safetyDeposit.data.store,
      newTokenAccount,
      safetyDeposit.pubkey.toBase58(),
      auctionView.vault.data.fractionMint,
      wallet.publicKey.toBase58(),
      wallet.publicKey.toBase58(),
      undefined,
      undefined,
      false,
      winningPrizeInstructions,
      winningConfigIndex
    );
  }
}

function isItemClaimed(
  bidRedemptionTickets: BidRedemptionTicket[],
  winnerIndex: number,
  safetyDepositBoxIndex: number
) {
  const winner = bidRedemptionTickets.find(
    (b) => b.data.winnerIndex && b.data.winnerIndex.eq(new BN(winnerIndex))
  );
  if (!winner) {
    return false;
  } else {
    return getBidRedeemed(winner, safetyDepositBoxIndex);
  }
}

function getBidRedeemed(ticket: BidRedemptionTicket, order: number): boolean {
  let offset = 42;
  if (ticket.data.data[1] == 0) {
    offset -= 8;
  }
  const index = Math.floor(order / 8) + offset;
  const positionFromRight = 7 - (order % 8);
  const mask = Math.pow(2, positionFromRight);

  const appliedMask = ticket.data.data[index] & mask;

  return appliedMask != 0;
}

async function setupRedeemFullRightsTransferInstructions(
  connection: Connection,
  auctionView: AuctionView,
  accountRentExempt: number,
  wallet: Wallet,
  safetyDeposit: SafetyDepositBox,
  signers: Array<Keypair[]>,
  instructions: Array<TransactionInstruction[]>,
  winningConfigIndex: number,
  bidRedemptionTickets: BidRedemptionTicket[]
) {
  const bidder = wallet.publicKey;
  const bidderMeta = await BidderMetadata.getPDA(
    auctionView.auction.pubkey,
    bidder
  );
  const bidRedemption = await mpActions.getBidRedemptionPDA(
    auctionView.auction.pubkey,
    bidderMeta
  );
  const transferAuthority = await Vault.getPDA(auctionView.vault.pubkey);
  const metadata = await Metadata.getPDA(safetyDeposit.data.tokenMint);
  const safetyDepositConfig = await SafetyDepositConfig.getPDA(
    auctionView.auctionManager.pubkey,
    auctionView.safetyDeposit.pubkey
  );
  const winningPrizeSigner: Keypair[] = [];
  const winningPrizeInstructions: TransactionInstruction[] = [];
  const claimed = isItemClaimed(
    bidRedemptionTickets,
    winningConfigIndex,
    safetyDeposit.data.order
  );
  signers.push(winningPrizeSigner);
  instructions.push(winningPrizeInstructions);

  console.log({ claimed });

  if (!claimed) {
    const destinationTokenAccount = await getOrCreateAssociatedAccountInfo(
      connection,
      wallet.publicKey,
      toPublicKey(safetyDeposit.data.tokenMint),
      wallet.publicKey,
      winningPrizeInstructions
    );

    await redeemFullRightsTransferBid(
      auctionView.auctionManager.data.vault,
      auctionView.auctionManager.data.store,
      safetyDeposit.data.store,
      destinationTokenAccount.toBase58(),
      safetyDeposit.pubkey.toBase58(),
      auctionView.vault.data.fractionMint,
      wallet.publicKey.toBase58(),
      wallet.publicKey.toBase58(),
      winningPrizeInstructions,
      metadata.toBase58(),
      wallet.publicKey.toBase58(),
      winningConfigIndex
    );
  }
}
