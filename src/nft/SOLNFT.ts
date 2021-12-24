import { TransactionResponse } from "@ethersproject/abstract-provider";
import {
  Auction,
  AuctionExtended,
  CreateAuctionV2,
  CreateAuctionV2Args,
} from "@metaplex-foundation/mpl-auction";
import { Transaction, TupleNumericType } from "@metaplex-foundation/mpl-core";
import {
  AuctionManager,
  AuctionWinnerTokenTypeTracker,
  EndAuction,
  InitAuctionManagerV2,
  WinningConfigType,
} from "@metaplex-foundation/mpl-metaplex";
import {
  EditionData,
  MasterEdition,
  MasterEditionData,
  Metadata,
  MetadataKey,
} from "@metaplex-foundation/mpl-token-metadata";
import { Vault } from "@metaplex-foundation/mpl-token-vault";
import { actions as mpActions, programs } from "@metaplex/js";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";
import { AbstractNFT, AuctionOffer } from "..";
import { Price, TokenType } from "../@types/graphql";
import { RefinableSolana } from "../RefinableSolana";
import {
  createAuctionManager,
  SafetyDepositDraft,
} from "../solana/actions/createAuctionManager";
import { QUOTE_MINT } from "../solana/constants";
import {
  AmountRange,
  PriceFloor,
  PriceFloorType,
  WinnerLimit,
  WinnerLimitType,
} from "../solana/oyster";
import { toLamports } from "../utils/sol";
import { PartialNFTItem } from "./AbstractNFT";
import { createExternalPriceAccount } from "./solana/actions/createExternalPriceAccount";
import { createVault } from "./solana/actions/createVault";
import {
  IPartialCreateAuctionArgs,
  makeAuction,
} from "./solana/actions/makeAuction";
import { sendTransactions, SequenceType, TxSets } from "./solana/connection";

const { CreateTokenAccount } = programs;

interface TransactionsBatchParams {
  beforeTransactions?: Transaction[];
  transactions: Transaction[];
  afterTransactions?: Transaction[];
}

export class TransactionsBatch {
  beforeTransactions: Transaction[];
  transactions: Transaction[];
  afterTransactions: Transaction[];

  signers: Keypair[] = [];

  constructor({
    beforeTransactions = [],
    transactions,
    afterTransactions = [],
  }: TransactionsBatchParams) {
    this.beforeTransactions = beforeTransactions;
    this.transactions = transactions;
    this.afterTransactions = afterTransactions;
  }

  addSigner(signer: Keypair) {
    this.signers.push(signer);
  }

  addBeforeTransaction(transaction: Transaction) {
    this.beforeTransactions.push(transaction);
  }

  addTransaction(transaction: Transaction) {
    this.transactions.push(transaction);
  }

  addAfterTransaction(transaction: Transaction) {
    this.afterTransactions.push(transaction);
  }

  toTransactions() {
    return [
      ...this.beforeTransactions,
      ...this.transactions,
      ...this.afterTransactions,
    ];
  }

  toInstructions() {
    return this.toTransactions().flatMap((t) => t.instructions);
  }
}

export class SOLNFT extends AbstractNFT {
  isApproved(operatorAddress?: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  approve(operatorAddress?: string): Promise<TransactionResponse> {
    throw new Error("Method not implemented.");
  }

  private getTokenAccountAddress(owner?: string) {
    return Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      new PublicKey(this._item.tokenId),
      new PublicKey(owner ?? this.refinable.accountAddress)
    );
  }

  async burn(supply = 1): Promise<any> {
    const tokenAddress = await this.getTokenAccountAddress();

    return mpActions.burnToken({
      connection: this.refinable.connection,
      wallet: this.refinable.provider,
      amount: supply,
      mint: new PublicKey(this._item.tokenId),
      token: tokenAddress,
    });
  }

  async transfer(
    _ownerAddress: string,
    recipientAddress: string,
    supply = 1
  ): Promise<any> {
    const tokenAddress = await this.getTokenAccountAddress();

    return mpActions.sendToken({
      connection: this.refinable.connection,
      wallet: this.refinable.provider,
      amount: supply,
      mint: new PublicKey(this._item.tokenId),
      source: tokenAddress,
      destination: new PublicKey(recipientAddress),
    });
  }

  buy(signature: string): Promise<any> {
    return mpActions.instantSale({
      connection: this.refinable.connection,
      wallet: this.refinable.provider,
      store: this.refinable.store.pubkey,
      auction: new PublicKey(signature),
    });
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
  }): Promise<{ txResponse: TransactionResponse; offer: AuctionOffer }> {
    throw new Error("Method not implemented.");
  }
  async cancelSale(): Promise<any> {
    // TODO where to get this from
    const vault = new PublicKey("");
    const { auction, auctionExtended } = await this.getAuctionKeys(vault);
    const auctionManagerPublicKey = await AuctionManager.getPDA(auction);
    const auctionManager = await AuctionManager.load(
      this.refinable.connection,
      auctionManagerPublicKey
    );
    // auctionManager.data.vault
    // endAuction

    const endAuctionTx = new EndAuction(
      { feePayer: this.refinable.provider.publicKey },
      {
        store: this.refinable.store.pubkey,
        auction,
        auctionManager: auctionManagerPublicKey,
        auctionExtended,
        auctionManagerAuthority: new PublicKey(auctionManager.data.authority),
      }
    );

    // claimUnusedPrizes

    const txId = await mpActions.sendTransaction({
      connection: this.refinable.connection,
      wallet: this.refinable.provider,
      txs: [endAuctionTx],
    });
  }
  placeBid(
    auctionContractAddress: string,
    price: Price,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<TransactionResponse> {
    throw new Error("Method not implemented.");
  }
  cancelAuction(
    auctionContractAddress: string,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<TransactionResponse> {
    throw new Error("Method not implemented.");
  }
  endAuction(
    auctionContractAddress: string,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<TransactionResponse> {
    throw new Error("Method not implemented.");
  }
  airdrop(recipients: string[]): Promise<TransactionResponse> {
    throw new Error("Method not implemented.");
  }

  constructor(
    protected readonly refinable: RefinableSolana,
    item: PartialNFTItem
  ) {
    super(TokenType.Spl, refinable, item);
  }

  private async getEditionInfo(metadata: Metadata, connection: Connection) {
    try {
      const edition = (
        await Metadata.getEdition(connection, metadata.data.mint)
      ).data;

      if (edition) {
        if (
          edition.key === MetadataKey.MasterEditionV1 ||
          edition.key === MetadataKey.MasterEditionV2
        ) {
          return {
            masterEdition: edition as MasterEditionData,
            edition: undefined,
          };
        }

        // This is an Edition NFT. Pull the Parent (MasterEdition)
        const masterEdition = (
          await MasterEdition.load(connection, (edition as EditionData).parent)
        ).data;
        if (masterEdition) {
          return {
            masterEdition,
            edition: edition as EditionData,
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

    const metadata = await Metadata.load(
      this.refinable.connection,
      metadataAccount
    );

    const { masterEdition, edition } = await this.getEditionInfo(
      metadata,
      this.refinable.connection
    );

    let winningConfigType: WinningConfigType;
    if (masterEdition?.key == MetadataKey.MasterEditionV1) {
      winningConfigType = WinningConfigType.PrintingV1;
    } else if (masterEdition?.key == MetadataKey.MasterEditionV2) {
      if (masterEdition.maxSupply) {
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

  async putForSale(price: Price): Promise<any> {
    const pt = this.getCurrency(price.currency);

    const winnerLimit = new WinnerLimit({
      type: WinnerLimitType.Capped,
      usize: new BN(1),
    });
    console.log(toLamports(price.amount, pt));

    const splPrice = new BN(toLamports(price.amount, pt).toString() ?? 0);

    const sdb = await this.getSafetyDepositDraft(this._item.tokenId);

    const res = await createAuctionManager(
      this.refinable.connection,
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
        tokenMint: QUOTE_MINT.toBase58(),
        gapTickSizePercentage: null,
        tickSize: null,
        instantSalePrice: splPrice,
        name: null,
      },
      [sdb],
      null,
      QUOTE_MINT.toBase58()
    );

    console.log(res);
    function pause(ms: number) {
      return new Promise((response) =>
        setTimeout(() => {
          response(0);
        }, ms)
      );
    }

    await pause(8000);

    const v = await Vault.load(this.refinable.connection, res.vault);

    console.log({ vault: v });
    const auc = await Auction.load(this.refinable.connection, res.auction);

    console.log({ auction: auc });

    // return await this.createAuction(
    //   {
    //     winners: winnerLimit,
    //     endAuctionAt: null, // instant sale
    //     auctionGap: null, // instant sale
    //     priceFloor: new PriceFloor({
    //       type: PriceFloorType.None,
    //       minPrice: splPrice,
    //     }),
    //     tokenMint: this._item.tokenId,
    //     gapTickSizePercentage: null,
    //     tickSize: null,
    //     instantSalePrice: splPrice,
    //     name: null,
    //   },
    //   new PublicKey(pt.address)
    // );
  }

  async test(auctionSettings: IPartialCreateAuctionArgs) {
    const solanaConfig = {
      connection: this.refinable.connection,
      wallet: this.refinable.provider,
    };

    const instructions: TransactionInstruction[][] = [];
    const signers: Keypair[][] = [];

    // 1. createExternalPriceAccount
    const externalPriceAccountData = await createExternalPriceAccount(
      solanaConfig,
      { instructions, signers }
    );

    // 2. createVault
    const vaultResponse = await createVault(
      {
        ...solanaConfig,
        ...externalPriceAccountData,
      },
      { instructions, signers }
    );

    // 3. makeAuction
    const makeAuctionResponse = await makeAuction(
      {
        ...solanaConfig,
        vault: vaultResponse.vault,
        auctionSettings,
      },
      { instructions, signers }
    );

    console.log({
      instructions,
      signers,
    });

    const tx = await sendTransactions(
      this.refinable.connection,
      this.refinable.provider,
      instructions,
      signers,
      SequenceType.StopOnFailure,
      "confirmed",
      async (txId) => {
        await this.refinable.connection.confirmTransaction(txId, "finalized");

        const v = await Vault.load(
          this.refinable.connection,
          vaultResponse.vault
        );

        console.log({ vault: v });
        const auc = await Auction.load(
          this.refinable.connection,
          makeAuctionResponse.auction
        );

        console.log({ auction: auc });
      }
    );
  }
  async createAuction(
    args: Omit<CreateAuctionV2Args, "resource" | "authority" | "instruction">,
    paymentMint: PublicKey = NATIVE_MINT
  ) {
    const tokenAccount = this.refinable.provider.publicKey;

    const solanaConfig = {
      connection: this.refinable.connection,
      wallet: this.refinable.provider,
    };

    const instructions: TransactionInstruction[][] = [];
    const signers: Keypair[][] = [];

    console.log("createExternalPriceAccount");

    // 1. createExternalPriceAccount
    const externalPriceAccountData = await createExternalPriceAccount(
      solanaConfig,
      { instructions, signers }
    );

    console.log("createVault", externalPriceAccountData);

    // 2. createVault
    const vaultResponse = await createVault(
      {
        ...solanaConfig,
        ...externalPriceAccountData,
      },
      { instructions, signers }
    );

    const vaultPubKey = vaultResponse.vault;

    console.log("get auction keys");

    // 3. CreateAuction
    const { auction, auctionExtended } = await this.getAuctionKeys(vaultPubKey);

    console.log("createAuctionTx", {
      auction,
      auctionExtended,
      creator: this.refinable.provider.publicKey,
      args: new CreateAuctionV2Args({
        ...args,
        authority: this.refinable.provider.publicKey.toBase58(),
        resource: vaultPubKey.toString(),
      }),
    });

    const createAuctionTx = new CreateAuctionV2(
      { feePayer: this.refinable.provider.publicKey },
      {
        auction,
        auctionExtended,
        creator: this.refinable.provider.publicKey,
        args: new CreateAuctionV2Args({
          ...args,
          authority: this.refinable.provider.publicKey.toBase58(),
          resource: vaultPubKey.toString(),
        }),
      }
    );

    signers.push([]);
    instructions.push(createAuctionTx.instructions);

    // Create Auction Manager
    const auctionManagerAuthority = this.refinable.provider.publicKey;
    const auctionManagerPDA = await AuctionManager.getPDA(auction);
    const tokenTrackerPDA = await AuctionWinnerTokenTypeTracker.getPDA(
      auctionManagerPDA
    );

    console.log("createTokenAccount", paymentMint);

    // 4. Create payment token
    const { account: paymentTokenAccount } = await this.createTokenAccount(
      paymentMint,
      { instructions, signers }
    );

    // txBatch.addSigner(paymentTokenAccount);
    // txBatch.addTransaction(paymentTokenAccountTx);

    console.log({
      vault: vaultPubKey.toBase58(),
      auction: auction.toBase58(),
      auctionManager: auctionManagerPDA.toBase58(),
      auctionManagerAuthority: auctionManagerAuthority.toBase58(),
      paymentTokenAccount: paymentTokenAccount.publicKey.toBase58(),
    });

    console.log("initAuctionManagerTx", {
      store: this.refinable.store.pubkey,
      vault: vaultPubKey,
      auction,
      auctionManager: auctionManagerPDA,
      auctionManagerAuthority,
      acceptPaymentAccount: paymentTokenAccount.publicKey,
      tokenTracker: tokenTrackerPDA,
      amountType: TupleNumericType.U8,
      lengthType: TupleNumericType.U8,
      maxRanges: new BN(10),
    });

    // 5. InitAuctionManager

    let maxRanges = [args.winners.usize.toNumber(), 100].sort()[0];

    if (maxRanges < 10) {
      maxRanges = 10;
    }

    const lengthType =
      args.winners.usize.toNumber() >= 254
        ? TupleNumericType.U16
        : TupleNumericType.U8;

    const initAuctionManagerTx = new InitAuctionManagerV2(
      { feePayer: this.refinable.provider.publicKey },
      {
        store: this.refinable.store.pubkey,
        vault: vaultPubKey,
        auction,
        auctionManager: auctionManagerPDA,
        auctionManagerAuthority,
        acceptPaymentAccount: paymentTokenAccount.publicKey,
        tokenTracker: tokenTrackerPDA,
        amountType: TupleNumericType.U16,
        lengthType,
        maxRanges: new BN(maxRanges),
      }
    );

    signers.push([]);
    instructions.push(initAuctionManagerTx.instructions);
    // txBatch.addTransaction(initAuctionManagerTx);

    //  AddTokenToInactiveVault

    // const vaultAuthority = await Vault.getPDA(vaultPubKey);

    // console.log(
    //   "createTokenAccount",
    //   new PublicKey(args.tokenMint),
    //   vaultAuthority
    // );

    // // 6. CreateVaultStoreAccount
    // const { account: newStoreAccount } = await this.createTokenAccount(
    //   new PublicKey(args.tokenMint),
    //   { instructions, signers },
    //   vaultAuthority
    // );
    // // txBatch.addTransaction(newStoreAccountTx);

    // // transfer authority

    // const transferAuthority = Keypair.generate();

    // console.log(
    //   "createApproveTransaction",
    //   tokenAccount,
    //   transferAuthority.publicKey.toBase58()
    // );

    // // 7. Create Approve Tx
    // await this.createApproveTx(
    //   tokenAccount,
    //   { instructions, signers },
    //   transferAuthority.publicKey
    // );
    // // txBatch.addTransaction(createApproveTransaction);

    // // console.log(
    // //   "createRevokeInstruction",
    // //   tokenAccount,
    // //   transferAuthority.publicKey
    // // );

    // // const createRevokeTransaction = new Transaction().add(
    // //   Token.createRevokeInstruction(
    // //     TOKEN_PROGRAM_ID,
    // //     tokenAccount,
    // //     this.refinable.provider.publicKey,
    // //     []
    // //   )
    // // );

    // // signers.push([]);
    // // instructions.push(createRevokeTransaction.instructions);

    // const safetyDepositBox = await Vault.getPDA(args.tokenMint);

    // console.log("AddTokenToInactiveVault", {
    //   vault: vaultPubKey,
    //   vaultAuthority: this.refinable.provider.publicKey,
    //   tokenAccount,
    //   tokenStoreAccount: newStoreAccount.publicKey,
    //   transferAuthority: transferAuthority.publicKey,
    //   safetyDepositBox: safetyDepositBox,
    //   amount: new BN(1),
    // });

    // const addTokenToInactiveVaultTx = new AddTokenToInactiveVault(
    //   { feePayer: this.refinable.provider.publicKey },
    //   {
    //     vault: vaultPubKey,
    //     vaultAuthority: this.refinable.provider.publicKey,
    //     tokenAccount,
    //     tokenStoreAccount: newStoreAccount.publicKey,
    //     transferAuthority: transferAuthority.publicKey,
    //     safetyDepositBox: safetyDepositBox,
    //     amount: new BN(1),
    //   }
    // );

    // signers.push([]);
    // instructions.push(addTokenToInactiveVaultTx.instructions);
    // // txBatch.addTransaction(addTokenToInactiveVaultTx);

    // console.log("closeVault", {
    //   priceMint: paymentMint,
    //   vault: vaultPubKey,
    // });

    // // Close Vault
    // await closeVault(
    //   {
    //     ...solanaConfig,
    //     ...vaultResponse,
    //     ...externalPriceAccountData,
    //   },
    //   { instructions, signers }
    // );

    // console.log("SetAuctionAuthority", {
    //   auction,
    //   currentAuthority: this.refinable.provider.publicKey,
    //   newAuthority: auctionManagerPDA,
    // });

    // // Set Authority to auctionManagerPDA
    // const setAuctionAuthorityTx = new SetAuctionAuthority(
    //   { feePayer: this.refinable.provider.publicKey },
    //   {
    //     auction,
    //     currentAuthority: this.refinable.provider.publicKey,
    //     newAuthority: auctionManagerPDA,
    //   }
    // );

    // signers.push([]);
    // instructions.push(setAuctionAuthorityTx.instructions);
    // // txBatch.addTransaction(setAuctionAuthorityTx);

    // console.log("setVaultAuthorityTx", {
    //   vault: vaultPubKey,
    //   currentAuthority: this.refinable.provider.publicKey,
    //   newAuthority: auctionManagerPDA,
    // });

    // const setVaultAuthorityTx = new SetVaultAuthority(
    //   { feePayer: this.refinable.provider.publicKey },
    //   {
    //     vault: vaultPubKey,
    //     currentAuthority: this.refinable.provider.publicKey,
    //     newAuthority: auctionManagerPDA,
    //   }
    // );

    // signers.push([]);
    // instructions.push(setVaultAuthorityTx.instructions);
    // // txBatch.addTransaction(setVaultAuthorityTx);

    // console.log("startAuctionTx", {
    //   store: this.refinable.store.pubkey,
    //   auction,
    //   auctionManager: auctionManagerPDA,
    //   auctionManagerAuthority,
    // });

    // // Start Auction
    // const startAuctionTx = new StartAuction(
    //   { feePayer: this.refinable.provider.publicKey },
    //   {
    //     store: this.refinable.store.pubkey,
    //     auction,
    //     auctionManager: auctionManagerPDA,
    //     auctionManagerAuthority,
    //   }
    // );

    // signers.push([]);
    // instructions.push(startAuctionTx.instructions);
    // // txBatch.addTransaction(startAuctionTx);

    console.log(signers.map((s) => s.map((d) => d.publicKey.toBase58())));
    console.log(instructions);

    const tx = await sendTransactions(
      this.refinable.connection,
      this.refinable.provider,
      instructions,
      signers,
      SequenceType.StopOnFailure,
      "single"
    );
  }

  private async createTokenAccount(
    mint: PublicKey,
    txSet: TxSets,
    owner?: PublicKey
  ) {
    const account = Keypair.generate();
    const mintRent =
      await this.refinable.connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
      );
    const feePayer = this.refinable.provider.publicKey;
    const newAccountPubkey = account.publicKey;

    txSet.instructions.push([
      SystemProgram.createAccount({
        fromPubkey: feePayer,
        newAccountPubkey,
        lamports: mintRent,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
      }),
      Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        mint,
        newAccountPubkey,
        owner ?? feePayer
      ),
    ]);

    txSet.signers.push([account]);

    return {
      account,
    };
  }

  private async getAuctionKeys(vault: PublicKey) {
    const [auction, auctionExtended] = await Promise.all([
      Auction.getPDA(vault),
      AuctionExtended.getPDA(vault),
    ]);

    return {
      auction,
      auctionExtended,
    };
  }

  private async createApproveTx(
    account: PublicKey,
    txSet: TxSets,
    delegate?: PublicKey
  ) {
    const transferAuthority = Keypair.generate();
    txSet.instructions.push([
      Token.createApproveInstruction(
        TOKEN_PROGRAM_ID,
        account,
        delegate ?? transferAuthority.publicKey,
        this.refinable.provider.publicKey,
        [],
        0
      ),
    ]);

    txSet.signers.push(!delegate ? [transferAuthority] : []);
  }
}
