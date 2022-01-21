import { Auction, AuctionExtended } from "@metaplex-foundation/mpl-auction";
import { Transaction } from "@metaplex-foundation/mpl-core";
import {
  AuctionManager,
  EndAuction,
  SafetyDepositConfig,
  WinningConfigType,
} from "@metaplex-foundation/mpl-metaplex";
import {
  Edition,
  MasterEdition,
  Metadata,
  MetadataKey,
} from "@metaplex-foundation/mpl-token-metadata";
import { Vault } from "@metaplex-foundation/mpl-token-vault";
import { actions as mpActions } from "@metaplex/js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import { AbstractNFT, AuctionOffer, SaleOffer } from "..";
import {
  CreateOfferForEditionsMutation,
  CreateOfferForEditionsMutationVariables,
  OfferType,
  Price,
  TokenType,
} from "../@types/graphql";
import { CREATE_OFFER } from "../graphql/sale";
import { RefinableSolanaClient } from "../refinable/RefinableSolanaClient";
import { claimUnusedPrizes } from "../solana/actions/claimUnusedPrizes";
import {
  createAuctionManager as createAuctionWithManager,
  SafetyDepositDraft,
} from "../solana/actions/createAuctionManager";
import { instantSale } from "../solana/actions/instantSale";
import {
  AmountRange,
  PriceFloor,
  PriceFloorType,
  WinnerLimit,
  WinnerLimitType,
} from "../solana/oyster";
import { toPublicKey } from "../solana/utils";
import SolanaTransaction from "../transaction/SolanaTransaction";
import { getConnectionByChainId } from "../utils/connection";
import { getOrCreateAssociatedAccountInfo, toLamports } from "../utils/sol";
import { PartialNFTItem } from "./AbstractNFT";
import { sendTransactions, SequenceType } from "./solana/connection";

export class SPLNFT extends AbstractNFT {
  private connection: Connection;

  constructor(
    protected readonly refinable: RefinableSolanaClient,
    item: PartialNFTItem
  ) {
    super(TokenType.Spl, refinable, item);

    this.connection = getConnectionByChainId(item.chainId);
  }

  getSaleContractAddress() {
    return "does not exist";
  }

  getBuyServiceFee() {
    return 0;
  }

  private getOrCreateTokenAccountAddress(
    instructions: TransactionInstruction[],
    owner?: string
  ) {
    return getOrCreateAssociatedAccountInfo(
      this.connection,
      this.refinable.accountAddress,
      toPublicKey(this.item.tokenId),
      owner ?? this.refinable.accountAddress,
      instructions
    );
  }

  async burn(supply = 1): Promise<SolanaTransaction> {
    const instructions: TransactionInstruction[] = [];
    const tokenAddress = await this.getOrCreateTokenAccountAddress(
      instructions
    );

    if (instructions.length) {
      await sendAndConfirmTransaction(
        this.connection,
        new Transaction().add(...instructions),
        [],
        { commitment: "single" }
      );
    }

    const { txId } = await mpActions.burnToken({
      connection: this.connection,
      wallet: this.refinable.provider,
      amount: supply,
      mint: new PublicKey(this._item.tokenId),
      token: tokenAddress,
    });

    return new SolanaTransaction(txId, this.connection);
  }

  async transfer(
    _ownerAddress: string,
    recipientAddress: string,
    supply = 1
  ): Promise<SolanaTransaction> {
    const instructions = [];
    const tokenAddress = await this.getOrCreateTokenAccountAddress(
      instructions
    );

    if (instructions.length) {
      await sendAndConfirmTransaction(
        this.connection,
        new Transaction().add(...instructions),
        [],
        { commitment: "single" }
      );
    }

    const { txId } = await mpActions.sendToken({
      connection: this.connection,
      wallet: this.refinable.provider,
      amount: supply,
      mint: new PublicKey(this._item.tokenId),
      source: tokenAddress,
      destination: new PublicKey(recipientAddress),
    });

    return new SolanaTransaction(txId, this.connection);
  }

  async buy({ blockchainId }: { blockchainId: string }): Promise<SolanaTransaction> {
    const vaultPubKey = new PublicKey(blockchainId);

    const auctionPDA = await Auction.getPDA(vaultPubKey);

    const { lastTxId } = await instantSale({
      connection: this.connection,
      wallet: this.refinable.provider,
      store: this.refinable.store.pubkey,
      auction: auctionPDA,
    });

    return new SolanaTransaction(lastTxId, this.connection);
  }

  async cancelSale({
    blockchainId,
  }: {
    blockchainId: string;
  }): Promise<SolanaTransaction> {
    const vaultPubKey = new PublicKey(blockchainId);

    const auctionPDA = await Auction.getPDA(vaultPubKey);
    const auctionExtendedPDA = await AuctionExtended.getPDA(vaultPubKey);
    const auctionManagerPDA = await AuctionManager.getPDA(auctionPDA);

    // get data for transactions
    const auctionManager = await AuctionManager.load(
      this.connection,
      auctionManagerPDA
    );
    const vault = await Vault.load(this.connection, blockchainId);
    const auctionExtended = await AuctionExtended.load(
      this.connection,
      auctionExtendedPDA
    );
    const auction = await Auction.load(this.connection, auctionPDA);
    const [safetyDepositBox] = await vault.getSafetyDepositBoxes(
      this.connection
    );
    const safetyDepositConfigPDA = await SafetyDepositConfig.getPDA(
      auctionManagerPDA,
      safetyDepositBox.pubkey
    );
    const {
      data: { winningConfigType, participationConfig },
    } = await SafetyDepositConfig.load(this.connection, safetyDepositConfigPDA);

    ////

    // 1. End Auction
    const endAuctionTx = new EndAuction(
      { feePayer: this.refinable.provider.publicKey },
      {
        store: this.refinable.store.pubkey,
        auction: auctionPDA,
        auctionManager: auctionManagerPDA,
        auctionExtended: auctionExtendedPDA,
        auctionManagerAuthority: toPublicKey(auctionManager.data.authority),
      }
    );

    const claimInstructions = [];
    const claimSigners = [];

    // 2. Claim unused items
    await claimUnusedPrizes(
      this.connection,
      this.refinable.store.pubkey.toBase58(),
      this.refinable.provider,
      {
        auction,
        vault,
        auctionExt: auctionExtended,
        auctionManager: auctionManager,
        participationConfig,
        safetyDeposit: safetyDepositBox,
      },
      {} as any,
      claimSigners,
      claimInstructions
    );

    const instructions = [endAuctionTx.instructions, ...claimInstructions];
    const signers = [[], ...claimSigners];

    const { lastTxId } = await sendTransactions(
      this.connection,
      this.refinable.provider,
      instructions,
      signers,
      SequenceType.StopOnFailure
    );

    return new SolanaTransaction(lastTxId, this.connection);
  }
  private async getEditionInfo(metadata: Metadata, connection: Connection) {
    try {
      const edition = await Metadata.getEdition(connection, metadata.data.mint);

      if (edition) {
        if (
          edition.data.key === MetadataKey.MasterEditionV1 ||
          edition.data.key === MetadataKey.MasterEditionV2
        ) {
          return {
            masterEdition: edition as MasterEdition,
            edition: undefined,
          };
        }

        // This is an Edition NFT. Pull the Parent (MasterEdition)
        const masterEdition = await MasterEdition.load(
          connection,
          (edition as any).data.parent
        );
        if (masterEdition) {
          return {
            masterEdition,
            edition: edition as Edition,
          };
        }
      }
    } catch {
      /* ignore */
    }

    return {
      masterEdition: undefined,
      edition: undefined,
    };
  }

  private async getSafetyDepositDraft(
    mint: string
  ): Promise<SafetyDepositDraft> {
    const tokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(mint),
      this.refinable.provider.publicKey
    );

    const metadataAccount = await Metadata.getPDA(new PublicKey(mint));

    const metadata = await Metadata.load(this.connection, metadataAccount);

    const { masterEdition, edition } = await this.getEditionInfo(
      metadata,
      this.connection
    );

    let winningConfigType: WinningConfigType;
    if (masterEdition?.data.key == MetadataKey.MasterEditionV1) {
      winningConfigType = WinningConfigType.PrintingV1;
    } else if (masterEdition?.data.key == MetadataKey.MasterEditionV2) {
      if (masterEdition.data.maxSupply) {
        winningConfigType = WinningConfigType.PrintingV2;
      } else {
        winningConfigType = WinningConfigType.Participation;
      }
    } else {
      winningConfigType =
        metadata.data.updateAuthority ===
        (
          this.refinable.provider.publicKey || SystemProgram.programId
        ).toBase58()
          ? WinningConfigType.FullRightsTransfer
          : WinningConfigType.TokenOnlyTransfer;
    }

    if (tokenAccount) {
      return {
        holding: tokenAccount.toBase58(),
        edition,
        masterEdition,
        metadata: {
          account: metadata.info,
          info: metadata.data as any,
          pubkey: metadata.pubkey.toBase58(),
        },
        winningConfigType: WinningConfigType.FullRightsTransfer,
        amountRanges: [
          new AmountRange({
            amount: new BN(1),
            length: new BN(1),
          }),
        ],
        participationConfig: null,
      };
    }
  }

  async putForSale(price: Price): Promise<SaleOffer> {
    const amount = 1;
    const pt = this.getCurrency(price.currency);
    const paymentMint = pt.address;

    const winnerLimit = new WinnerLimit({
      type: WinnerLimitType.Capped,
      usize: new BN(1),
    });

    const splPrice = new BN(toLamports(price.amount, pt).toString() ?? 0);

    const sdb = await this.getSafetyDepositDraft(this._item.tokenId);

    const createAuctionResult = await createAuctionWithManager(
      this.connection,
      this.refinable.provider,
      this.refinable.store.pubkey.toBase58(),
      {
        winners: winnerLimit,
        endAuctionAt: null, // instant sale
        auctionGap: null, // instant sale
        priceFloor: new PriceFloor({
          type: PriceFloorType.Minimum,
          minPrice: splPrice,
        }),
        tokenMint: paymentMint,
        gapTickSizePercentage: null,
        tickSize: null,
        instantSalePrice: splPrice,
        name: null,
      },
      [sdb],
      null,
      paymentMint
    );

    const result = await this.refinable.apiClient.request<
      CreateOfferForEditionsMutation,
      CreateOfferForEditionsMutationVariables
    >(CREATE_OFFER, {
      input: {
        transactionHash: createAuctionResult.lastTxId,
        tokenId: this.item.tokenId,
        blockchainId: createAuctionResult.vault,
        type: OfferType.Sale,
        contractAddress: this.item.contractAddress,
        price: {
          currency: price.currency,
          amount: parseFloat(price.amount.toString()),
        },
        supply: amount,
      },
    });

    if (createAuctionResult.lastTxId) {
      await this.connection.confirmTransaction(
        createAuctionResult.lastTxId,
        "finalized"
      );
    }

    return this.refinable.createOffer<OfferType.Sale>(
      { ...result.createOfferForItems, type: OfferType.Sale },
      this
    );
  }
  // ==
  placeBid(
    auctionContractAddress: string,
    price: Price,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<SolanaTransaction> {
    throw new Error("Method not implemented.");
  }
  cancelAuction(
    auctionContractAddress: string,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<SolanaTransaction> {
    throw new Error("Method not implemented.");
  }
  endAuction(
    auctionContractAddress: string,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<SolanaTransaction> {
    throw new Error("Method not implemented.");
  }
  airdrop(recipients: string[]): Promise<SolanaTransaction> {
    throw new Error("Method not implemented.");
  }
  putForAuction({
    price,
    auctionStartDate,
    auctionEndDate,
    royaltyContractAddress,
  }: {
    price: Price;
    auctionStartDate: Date;
    auctionEndDate: Date;
    royaltyContractAddress?: string;
  }): Promise<{ txResponse: SolanaTransaction; offer: AuctionOffer }> {
    throw new Error("Method not implemented.");
  }
}
