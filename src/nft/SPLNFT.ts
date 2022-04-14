import { Transaction } from "@metaplex-foundation/mpl-core";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { actions as mpActions } from "@metaplex/js";
import { BN, Program, Provider } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
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
import {
  AUCTION_HOUSE_PROGRAM_ID,
  getAuctionHouseKey,
  getAuctionHouseTradeState,
  getBuyerEscrow,
  getPriceWithMantissa,
  getProgramAsSigner,
  getRemainingAccounts,
} from "../solana/ah";
import { AuctionHouse, IDL } from "../solana/idl/auction_house";
import { sendTransactionWithRetry } from "../solana/oyster";
import { toPublicKey } from "../solana/utils";
import SolanaTransaction from "../transaction/SolanaTransaction";
import { getConnectionByChainId } from "../utils/connection";
import { getOrCreateAssociatedAccountInfo } from "../utils/sol";
import { PartialNFTItem } from "./AbstractNFT";

const treasuryMint = NATIVE_MINT;

export class SPLNFT extends AbstractNFT {
  private connection: Connection;
  private auctionHouseClient: Program<AuctionHouse>;

  constructor(
    protected readonly refinable: RefinableSolanaClient,
    item: PartialNFTItem
  ) {
    super(TokenType.Spl, refinable, item);

    this.connection = getConnectionByChainId(item.chainId);
    this.auctionHouseClient = new Program<AuctionHouse>(
      IDL,
      AUCTION_HOUSE_PROGRAM_ID,
      new Provider(
        this.connection,
        this.refinable.provider,
        Provider.defaultOptions()
      )
    );
  }

  getSaleContractAddress() {
    return "does not exist";
  }

  async getBuyServiceFee() {
    const auctionHouse = await getAuctionHouseKey(
      this.item.chainId,
      treasuryMint
    );

    const auctionHouseObj =
      await this.auctionHouseClient.account.auctionHouse.fetch(auctionHouse);

    if (!auctionHouseObj.sellerFeeBasisPoints) return 0;

    return auctionHouseObj.sellerFeeBasisPoints;
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

  async buy({
    blockchainId,
    price,
    ownerEthAddress,
  }: {
    blockchainId: string;
    price: Price;
    ownerEthAddress: string;
  }): Promise<SolanaTransaction> {
    const auctionHouse = await getAuctionHouseKey(
      this.item.chainId,
      treasuryMint
    );

    const auctionHouseObj =
      await this.auctionHouseClient.account.auctionHouse.fetch(auctionHouse);

    const isNative = auctionHouseObj.treasuryMint.equals(NATIVE_MINT);

    const buyerPrice = new BN(
      await getPriceWithMantissa(
        price.amount,
        auctionHouseObj.treasuryMint,
        this.refinable.provider,
        this.connection
      )
    );
    const tokenSize = new BN(1);

    const buyerTokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      toPublicKey(this.item.tokenId),
      toPublicKey(this.refinable.accountAddress)
    );

    const metadata = await Metadata.getPDA(toPublicKey(this.item.tokenId));

    const sellerTokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      toPublicKey(this.item.tokenId),
      toPublicKey(ownerEthAddress)
    );

    const [programAsSigner, programAsSignerBump] = await getProgramAsSigner();

    const [buyerEscrow, buyerEscrowBump] = await getBuyerEscrow(
      auctionHouse,
      this.refinable.accountAddress
    );

    const [buyerTradeState, buyerTradeStateBump] =
      await getAuctionHouseTradeState(
        auctionHouse,
        toPublicKey(this.refinable.accountAddress),
        sellerTokenAccount,
        auctionHouseObj.treasuryMint,
        toPublicKey(this.item.tokenId),
        tokenSize,
        buyerPrice
      );

    const buyInstruction = await this.auctionHouseClient.instruction.buy(
      buyerTradeStateBump,
      buyerEscrowBump,
      buyerPrice,
      tokenSize,
      {
        accounts: {
          wallet: toPublicKey(this.refinable.accountAddress),
          paymentAccount: toPublicKey(this.refinable.accountAddress),
          // Isnative check
          transferAuthority: toPublicKey(this.refinable.accountAddress),
          treasuryMint: auctionHouseObj.treasuryMint,
          tokenAccount: sellerTokenAccount,
          metadata,
          escrowPaymentAccount: buyerEscrow,
          authority: auctionHouseObj.authority,
          auctionHouse,
          auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
          buyerTradeState,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }
    );

    // Execute trade.
    const zero = new BN(0);
    const [sellerTradeState] = await getAuctionHouseTradeState(
      auctionHouse,
      toPublicKey(ownerEthAddress),
      sellerTokenAccount,
      auctionHouseObj.treasuryMint,
      toPublicKey(this.item.tokenId),
      tokenSize,
      buyerPrice
    );

    const [freeSellerTradeState, freeSellerTradeStateBump] =
      await getAuctionHouseTradeState(
        auctionHouse,
        toPublicKey(ownerEthAddress),
        sellerTokenAccount,
        auctionHouseObj.treasuryMint,
        toPublicKey(this.item.tokenId),
        tokenSize,
        zero
      );

    const remainingAccounts = await getRemainingAccounts(
      this.connection,
      metadata,
      isNative,
      auctionHouseObj.treasuryMint
    );

    const executeSaleInstruction =
      await this.auctionHouseClient.instruction.executeSale(
        buyerEscrowBump,
        freeSellerTradeStateBump,
        programAsSignerBump,
        buyerPrice,
        tokenSize,
        {
          accounts: {
            buyer: toPublicKey(this.refinable.accountAddress),
            seller: toPublicKey(ownerEthAddress),
            tokenAccount: sellerTokenAccount,
            tokenMint: toPublicKey(this.item.tokenId),
            metadata,
            treasuryMint: auctionHouseObj.treasuryMint,
            escrowPaymentAccount: buyerEscrow,
            // TODO: Support other tokens
            sellerPaymentReceiptAccount: toPublicKey(ownerEthAddress),
            buyerReceiptTokenAccount: buyerTokenAccount,
            authority: auctionHouseObj.authority,
            auctionHouse,
            auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
            auctionHouseTreasury: auctionHouseObj.auctionHouseTreasury,
            buyerTradeState,
            sellerTradeState,
            freeTradeState: freeSellerTradeState,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            ataProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            programAsSigner,
            rent: SYSVAR_RENT_PUBKEY,
          },
          remainingAccounts,
        }
      );

    buyInstruction.keys
      .filter((k) =>
        k.pubkey.equals(toPublicKey(this.refinable.accountAddress))
      )
      .map((k) => (k.isSigner = true));

    executeSaleInstruction.keys
      .filter((k) =>
        k.pubkey.equals(toPublicKey(this.refinable.accountAddress))
      )
      .map((k) => (k.isSigner = true));

    const tx = await sendTransactionWithRetry(
      this.connection,
      this.refinable.provider,
      [buyInstruction, executeSaleInstruction],
      [],
      "max"
    );

    return new SolanaTransaction(tx.txid, this.connection);
  }

  async cancelSale({
    blockchainId,
    price,
    selling,
  }: {
    blockchainId: string;
    price: Price;
    selling: number;
  }): Promise<SolanaTransaction> {
    const auctionHouse = await getAuctionHouseKey(
      this.item.chainId,
      treasuryMint
    );
    const auctionHouseObj =
      await this.auctionHouseClient.account.auctionHouse.fetch(auctionHouse);

    const buyerPrice = new BN(
      await getPriceWithMantissa(
        price.amount,
        auctionHouseObj.treasuryMint,
        this.refinable.provider,
        this.connection
      )
    );
    const tokenSize = new BN(selling);

    const sellerTokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      toPublicKey(this.item.tokenId),
      toPublicKey(this.refinable.accountAddress)
    );

    const txSig = await this.auctionHouseClient.rpc.cancel(
      buyerPrice,
      tokenSize,
      {
        accounts: {
          wallet: new PublicKey(this.refinable.accountAddress),
          tokenAccount: sellerTokenAccount,
          tokenMint: toPublicKey(this.item.tokenId),
          authority: auctionHouseObj.authority,
          auctionHouse,
          auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
          tradeState: blockchainId,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );

    return new SolanaTransaction(txSig, this.connection);
  }

  async putForSale(params: { price: Price }): Promise<SaleOffer> {
    const amount = 1;

    const auctionHouse = await getAuctionHouseKey(
      this.item.chainId,
      treasuryMint
    );

    const auctionHouseObj =
      await this.auctionHouseClient.account.auctionHouse.fetch(auctionHouse);

    const buyerPrice = new BN(
      await getPriceWithMantissa(
        params.price.amount,
        auctionHouseObj.treasuryMint,
        this.refinable.provider,
        this.connection
      )
    );

    const sellerTokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      toPublicKey(this.item.tokenId),
      toPublicKey(this.refinable.accountAddress)
    );

    const tokenSize = new BN(amount);
    const zero = new BN(0);

    const [sellerTradeState, sellerTradeStateBump] =
      await getAuctionHouseTradeState(
        auctionHouse,
        toPublicKey(this.refinable.accountAddress),
        sellerTokenAccount,
        auctionHouseObj.treasuryMint,
        toPublicKey(this.item.tokenId),
        tokenSize,
        buyerPrice
      );
    const [freeSellerTradeState, freeSellerTradeStateBump] =
      await getAuctionHouseTradeState(
        auctionHouse,
        toPublicKey(this.refinable.accountAddress),
        sellerTokenAccount,
        auctionHouseObj.treasuryMint,
        toPublicKey(this.item.tokenId),
        tokenSize,
        zero
      );

    const [programAsSigner, programAsSignerBump] = await getProgramAsSigner();

    const txSig = await this.auctionHouseClient.rpc.sell(
      sellerTradeStateBump,
      freeSellerTradeStateBump,
      programAsSignerBump,
      buyerPrice,
      tokenSize,
      {
        accounts: {
          wallet: new PublicKey(this.refinable.accountAddress),
          tokenAccount: sellerTokenAccount,
          metadata: (
            await Metadata.getPDA(toPublicKey(this.item.tokenId))
          ).toBase58(),
          authority: auctionHouseObj.authority,
          auctionHouse,
          auctionHouseFeeAccount: auctionHouseObj.auctionHouseFeeAccount,
          sellerTradeState,
          freeSellerTradeState,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          programAsSigner,
          rent: SYSVAR_RENT_PUBKEY,
        },
      }
    );

    const result = await this.refinable.apiClient.request<
      CreateOfferForEditionsMutation,
      CreateOfferForEditionsMutationVariables
    >(CREATE_OFFER, {
      input: {
        transactionHash: txSig,
        tokenId: this.item.tokenId,
        blockchainId: sellerTradeState.toBase58(),
        type: OfferType.Sale,
        contractAddress: this.item.contractAddress,
        price: {
          currency: params.price.currency,
          amount: parseFloat(params.price.amount.toString()),
        },
        supply: amount,
      },
    });

    if (txSig) {
      await this.connection.confirmTransaction(txSig, "finalized");
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
  }: {
    price: Price;
    auctionStartDate: Date;
    auctionEndDate: Date;
  }): Promise<{ txResponse: SolanaTransaction; offer: AuctionOffer }> {
    throw new Error("Method not implemented.");
  }
}
