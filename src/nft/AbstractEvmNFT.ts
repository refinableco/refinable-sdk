import type { TransactionResponse } from "@ethersproject/abstract-provider";
import assert from "assert";
import { BigNumber, Contract, utils } from "ethers";
import { soliditySha3 } from "web3-utils";
import {
  ContractTag,
  ContractTypes,
  CreateOfferForEditionsMutation,
  MarketConfig,
  OfferType,
  Price,
  TokenType,
} from "../@types/graphql";
import { FeeType } from "../enums/fee-type.enum";
import { CREATE_OFFER } from "../graphql/sale";
import { LibPart } from "../interfaces/LibPart";
import { AuctionOffer } from "../offer/AuctionOffer";
import { SaleOffer } from "../offer/SaleOffer";
import { Refinable } from "../refinable/Refinable";
import { RefinableEvmClient } from "../refinable/client/RefinableEvmClient";
import EvmTransaction from "../transaction/EvmTransaction";
import { Transaction } from "../transaction/Transaction";
import { getSupportedCurrency, parseBPS } from "../utils/chain";
import { isERC1155Item } from "../utils/is";
import {
  getUnixEpochTimeStampFromDate,
  getUnixEpochTimeStampFromDateOr0,
} from "../utils/time";
import { optionalParam } from "../utils/utils";
import {
  AbstractNFT,
  NFTEndAuctionParams,
  NFTPlaceBidParams,
  PartialNFTItem,
} from "./AbstractNFT";
import { ERCSaleID } from "./ERCSaleId";
import { SaleInfo, SaleVersion } from "./interfaces/SaleInfo";
import { WhitelistVoucherParams } from "./interfaces/Voucher";

export type EvmTokenType = TokenType.Erc1155 | TokenType.Erc721;

const auctionTypes = [
  ContractTypes.Auction,
  ContractTypes.Erc1155Auction,
  ContractTypes.Erc721Auction,
];

export abstract class AbstractEvmNFT extends AbstractNFT {
  protected _item: PartialNFTItem;
  private nftTokenContract: Contract | null;
  protected readonly refinableEvmClient: RefinableEvmClient;

  constructor(
    public type: EvmTokenType,
    protected readonly refinable: Refinable,
    protected item: PartialNFTItem
  ) {
    super(type, refinable, item);
    this.refinableEvmClient = refinable.evm;
  }

  async getSaleId() {
    return this.saleContract.getID(
      this.refinable.accountAddress,
      this.item.contractAddress,
      this.item.tokenId
    );
  }

  getSaleContractAddress(): string {
    // Error if User is on a wrong chain, if this is the case, we can just return null
    try {
      return this.saleContract.address;
    } catch {}

    return null;
  }

  get saleContract(): Contract {
    const sale = this.refinableEvmClient.contracts.getBaseContract(
      this.item.chainId,
      ContractTypes.Sale
    );

    return sale.toEthersContract();
  }

  get auctionContract(): Contract {
    const auction = this.refinableEvmClient.contracts.getBaseContract(
      this.item.chainId,
      ContractTypes.Auction
    );

    return auction.toEthersContract();
  }

  get nonceContract(): Contract {
    const saleNonceHolder = this.refinableEvmClient.contracts.getBaseContract(
      this.item.chainId,
      `${this.type}_SALE_NONCE_HOLDER`
    );

    return saleNonceHolder.toEthersContract();
  }

  get transferProxyContract(): Contract {
    const transferProxy = this.refinableEvmClient.contracts.getBaseContract(
      this.item.chainId,
      `TRANSFER_PROXY`
    );

    return transferProxy.toEthersContract();
  }

  get airdropContract(): Contract | null {
    const airdrop = this.refinableEvmClient.contracts.getBaseContract(
      this.item.chainId,
      `${this.type}_AIRDROP`
    );

    return airdrop?.toEthersContract();
  }

  public async getTokenContract() {
    if (this.nftTokenContract) return this.nftTokenContract;

    const isERC1155 = isERC1155Item(this);
    const type = isERC1155
      ? [ContractTypes.Erc1155Token, ContractTypes.Erc1155WhitelistedToken]
      : [ContractTypes.Erc721Token, ContractTypes.Erc721WhitelistedToken];

    const nftTokenContract =
      await this.refinableEvmClient.contracts.getRefinableContract(
        this.item.chainId,
        this.item.contractAddress,
        type
      );

    this.nftTokenContract = nftTokenContract.toEthersContract();

    return this.nftTokenContract;
  }

  public getItem() {
    return {
      type: this.type,
      ...this.item,
    };
  }

  public setItem(item: PartialNFTItem): void {
    this.item = item;
  }

  verifyItem() {
    if (!this.item) throw new Error("Unable to do this action, item required");

    if (!this.item.tokenId) {
      throw new Error("tokenId is not set");
    }

    if (!this.item.contractAddress) {
      throw new Error("contract address is not set");
    }
  }

  abstract isApproved(operatorAddress?: string): Promise<boolean>;
  abstract approve(operatorAddress?: string): Promise<EvmTransaction>;
  abstract burn(
    supply?: number,
    ownerEthAddress?: string
  ): Promise<EvmTransaction>;
  abstract putForSale(params: {
    price: Price;
    supply?: number;
  }): Promise<SaleOffer>;
  abstract transfer(
    ownerEthAddress: string,
    recipientEthAddress: string,
    supply?: number
  ): Promise<EvmTransaction>;
  abstract buy(params: {
    blockchainId: string;
    signature?: string;
    price: Price;
    ownerEthAddress: string;
    supply?: number;
    amount?: number;
    startTime?: Date;
    endTime?: Date;
    marketConfig?: MarketConfig;
  }): Promise<EvmTransaction>;
  abstract buyUsingVoucher(
    params: {
      blockchainId: string;
      signature?: string;
      price: Price;
      ownerEthAddress: string;
      supply?: number;
      amount?: number;
      startTime?: Date;
      endTime?: Date;
      marketConfig?: MarketConfig;
    },
    voucher: WhitelistVoucherParams
  ): Promise<EvmTransaction>;

  async putForAuction({
    price,
    auctionStartDate,
    auctionEndDate,
  }: {
    price: Price;
    auctionStartDate: Date;
    auctionEndDate: Date;
  }): Promise<{
    txResponse: EvmTransaction;
    offer: AuctionOffer;
  }> {
    await this.approveIfNeeded(this.auctionContract.address);

    const currentAuctionContract =
      await this.refinableEvmClient.contracts.getRefinableContract(
        this.item.chainId,
        this.auctionContract.address,
        auctionTypes
      );

    const addressToApprove = this.auctionContract.address;
    await this.approveIfNeeded(addressToApprove);

    const ethersContracts = currentAuctionContract.toEthersContract();
    const startPrice = this.parseCurrency(price.currency, price.amount);
    const paymentToken = this.getPaymentToken(price.currency);

    const blockchainAuctionResponse = await ethersContracts.createAuction(
      // address _token
      this.item.contractAddress,
      // uint256 _tokenId
      this.item.tokenId,
      // address _payToken
      paymentToken,
      // uint256 _startPrice
      startPrice,
      // uint256 _startTimestamp
      getUnixEpochTimeStampFromDate(auctionStartDate),
      //uint256 _endTimestamp
      getUnixEpochTimeStampFromDate(auctionEndDate)
    );

    const result =
      await this.refinable.apiClient.request<CreateOfferForEditionsMutation>(
        CREATE_OFFER,
        {
          input: {
            chainId: this.item.chainId,
            tokenId: this.item.tokenId,
            contractAddress: this.item.contractAddress,
            type: OfferType.Auction,
            price,
            supply: 1,
            offerContractAddress: blockchainAuctionResponse.to,
            transactionHash: blockchainAuctionResponse.hash,
            startTime: auctionStartDate,
            endTime: auctionEndDate,
          },
        }
      );

    await blockchainAuctionResponse.wait(
      this.refinableEvmClient.options.waitConfirmations
    );

    const offer = this.refinable.offer.createOffer<AuctionOffer>(
      result.createOfferForItems,
      this
    );

    return {
      txResponse: new EvmTransaction(blockchainAuctionResponse),
      offer,
    };
  }

  async placeBid(params: NFTPlaceBidParams): Promise<EvmTransaction> {
    const { auctionContractAddress, price, marketConfig, auctionId } = params;

    this.verifyItem();

    const priceWithServiceFee = await this._chain.getPriceWithBuyServiceFee(
      price,
      marketConfig.buyServiceFeeBps.value
    );

    await this.refinableEvmClient.account.approveTokenContractAllowance(
      this.getCurrency(priceWithServiceFee.currency),
      priceWithServiceFee.amount,
      auctionContractAddress
    );

    const value = this.parseCurrency(
      price.currency,
      priceWithServiceFee.amount
    );

    const valueParam = optionalParam(
      // If currency is Native, send msg.value
      this.isNativeCurrency(priceWithServiceFee.currency),
      {
        value,
      }
    );

    const currentAuctionContract =
      await this.refinable.evm.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress,
        auctionTypes
      );
    const ethersContracts = currentAuctionContract.toEthersContract();

    let placeBidTx: TransactionResponse;

    if (currentAuctionContract.hasTag(ContractTag.AuctionV1_0_0))
      throw new Error("No longer supported");

    let auctionIdOrFetch = auctionId;

    if (!auctionId) {
      auctionIdOrFetch = await this.getAuctionId(auctionContractAddress);
    }

    assert(!!auctionIdOrFetch, "AuctionId must be defined");

    const bidAmount = this.parseCurrency(price.currency, price.amount);

    placeBidTx = await ethersContracts.placeBid(
      auctionIdOrFetch,
      ...optionalParam(
        currentAuctionContract.hasTag(ContractTag.AuctionV5_0_0),
        bidAmount, // uint256 bidAmount
        marketConfig.data ?? "0x",
        marketConfig.signature ?? "0x"
      ),
      ...valueParam
    );

    return new EvmTransaction(placeBidTx);
  }

  async getAuctionId(auctionContractAddress: string): Promise<string> {
    const currentAuctionContract =
      await this.refinable.evm.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress,
        auctionTypes
      );

    return currentAuctionContract
      .toEthersContract()
      .getAuctionId(
        this.item.contractAddress,
        this.item.tokenId,
        this.refinable.accountAddress
      );
  }

  /**
   * Cancels an auction, without transfering the NFT.
   * @param auctionContractAddress The contractAddress for the auction contract you are interacting with
   * @param auctionId The auction identifier bound to the owner and token address and id
   * @param ownerEthAddress
   * @returns
   */
  async cancelAuction(
    auctionContractAddress: string,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<EvmTransaction> {
    const currentAuctionContract =
      await this.refinable.evm.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress,
        auctionTypes
      );

    const ethersContract = currentAuctionContract.toEthersContract();
    let cancelAuctionTx: TransactionResponse;

    if (currentAuctionContract.hasTag(ContractTag.AuctionV1_0_0)) {
      cancelAuctionTx = await ethersContract.cancelAuction(
        // uint256 tokenId
        this.item.tokenId,
        ownerEthAddress
      );
    } else {
      if (!auctionId) {
        auctionId = await this.getAuctionId(auctionContractAddress);
      }

      assert(!!auctionId, "AuctionId must be defined");

      cancelAuctionTx = await ethersContract.cancelAuction(auctionId);
    }

    return new EvmTransaction(cancelAuctionTx);
  }

  /**
   * Ends an Auction where time has run out. Ending an auction will transfer the nft to the winning bid.
   * @param params NFTEndAuctionParams
   * @returns
   */
  async endAuction(params: NFTEndAuctionParams): Promise<EvmTransaction> {
    const { auctionContractAddress, ownerEthAddress, marketConfig, auctionId } =
      params;

    const currentAuctionContract =
      await this.refinable.evm.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress,
        auctionTypes
      );

    const ethersContract = currentAuctionContract.toEthersContract();
    let endAuctionTx: TransactionResponse;

    if (currentAuctionContract.hasTag(ContractTag.AuctionV1_0_0)) {
      endAuctionTx = await ethersContract.endAuction(
        // uint256 tokenId
        this.item.tokenId,
        ownerEthAddress
      );
    } else {
      let auctionIdOrFetch = auctionId;

      if (!auctionId) {
        auctionIdOrFetch = await this.getAuctionId(auctionContractAddress);
      }

      assert(!!auctionIdOrFetch, "AuctionId must be defined");

      endAuctionTx = await ethersContract.endAuction(
        auctionIdOrFetch,
        ...optionalParam(
          currentAuctionContract.hasTag(ContractTag.AuctionV5_0_0),
          marketConfig.data ?? "0x",
          marketConfig.signature ?? "0x"
        )
      );
    }

    return new EvmTransaction(endAuctionTx);
  }

  async cancelSale(): Promise<EvmTransaction> {
    this.verifyItem();

    const cancelTx: TransactionResponse = await this.saleContract.cancel(
      this.item.contractAddress,
      this.item.tokenId
    );

    return new EvmTransaction(cancelTx);
  }

  async airdrop(recipients: string[]): Promise<EvmTransaction> {
    this.verifyItem();

    await this.approveIfNeeded(this.airdropContract.address);

    if (this.item.supply != null) {
      assert(
        recipients.length <= this.item.supply,
        "Not enough supply for this amount of recipients"
      );
    }

    const tokenIds =
      this.type === TokenType.Erc721 ? [this.item.tokenId] : this.item.tokenId;

    const airdropTx = await this.airdropContract.airdrop(
      this.item.contractAddress,
      tokenIds,
      recipients
    );

    return new EvmTransaction(airdropTx);
  }

  public async getBuyServiceFee(
    contractAddress: string,
    marketConfigData: string = "0x",
    marketConfigDataSignature: string = "0x"
  ): Promise<number> {
    const sale = this.refinable.evm.contracts.getBaseContract(
      this.item.chainId,
      ContractTypes.ServiceFeeV2
    );

    const fees: LibPart[] = await sale
      .toEthersContract()
      .getServiceFees(
        FeeType.BUY,
        this.refinable.accountAddress,
        contractAddress,
        marketConfigData,
        marketConfigDataSignature
      );

    const totalBuyFeeBps = fees.reduce(
      (total, { value }) => (total += value.toNumber()),
      0
    );

    return parseBPS(BigNumber.from(totalBuyFeeBps));
  }

  async getMinBidIncrement(auctionContractAddress: string): Promise<number> {
    const currentAuctionContract =
      await this.refinable.evm.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress,
        auctionTypes
      );

    const ethersContract = currentAuctionContract.toEthersContract();

    if (currentAuctionContract.hasTagSemver("AUCTION", "<3.1.0")) {
      return 0;
    }
    const minBidIncrementBps: BigNumber =
      await ethersContract.minBidIncrementBps();

    return parseBPS(minBidIncrementBps) / 100;
  }

  public async approveIfNeeded(
    operatorAddress: string
  ): Promise<Transaction | null> {
    const isContractDeployed =
      await this.refinable.evm.contracts.isContractDeployed(operatorAddress);

    if (!isContractDeployed) {
      throw new Error(
        `OperatContract at address ${operatorAddress} is not deployed`
      );
    }

    const isApproved = await this.isApproved(operatorAddress);

    if (!isApproved) {
      const approvalResult = await this.approve(operatorAddress);

      // Wait for confirmations
      await approvalResult.wait(
        this.refinableEvmClient.options.waitConfirmations
      );

      return approvalResult;
    }
  }

  protected async _buy(params: {
    signature?: string;
    blockchainId?: string;
    price: Price;
    ownerEthAddress: string;
    supply?: number;
    amount?: number;
    startTime?: Date;
    endTime?: Date;
    voucher?: WhitelistVoucherParams;
    marketConfig?: MarketConfig;
  }): Promise<EvmTransaction> {
    const {
      signature,
      price: pricePerCopy,
      ownerEthAddress,
      supply = 1,
      amount = 1,
      blockchainId,
      startTime,
      endTime,
      marketConfig,
    } = params;

    this.verifyItem();

    const priceWithServiceFee = await this._chain.getPriceWithBuyServiceFee(
      pricePerCopy,
      marketConfig.buyServiceFeeBps.value,
      amount
    );

    const voucherPriceAmount = params.voucher?.price ?? 0;
    const voucherPriceWithServiceFee =
      await this._chain.getPriceWithBuyServiceFee(
        {
          amount: voucherPriceAmount,
          currency: pricePerCopy.currency,
        },
        marketConfig.buyServiceFeeBps.value,
        amount
      );

    await this.refinableEvmClient.account.approveTokenContractAllowance(
      this.getCurrency(priceWithServiceFee.currency),
      priceWithServiceFee.amount,
      this.saleContract.address
    );

    const paymentToken = this.getPaymentToken(pricePerCopy.currency);
    const isNativeCurrency = this.isNativeCurrency(pricePerCopy.currency);
    let value = this.parseCurrency(
      pricePerCopy.currency,
      priceWithServiceFee.amount
    );
    const price = this.parseCurrency(
      pricePerCopy.currency,
      pricePerCopy.amount
    );
    const voucherPrice = this.parseCurrency(
      pricePerCopy.currency,
      voucherPriceAmount
    );

    if (params?.voucher?.price > 0) {
      value = this.parseCurrency(
        voucherPriceWithServiceFee.currency,
        voucherPriceWithServiceFee.amount
      );
    }

    const saleID = ERCSaleID.fromBlockchainId(blockchainId);

    const saleInfo: SaleInfo = {
      token: this.item.contractAddress,
      tokenId: this.item.tokenId,
      signature,
      saleVersion: saleID?.version ?? SaleVersion.V1,
      price,
      payToken: paymentToken,
      seller: ownerEthAddress,
      selling: supply,
      buying: amount,
      startTime: getUnixEpochTimeStampFromDateOr0(startTime),
      endTime: getUnixEpochTimeStampFromDateOr0(endTime),
      marketConfigData: marketConfig?.data ?? "0x",
      marketConfigDataSignature: marketConfig?.signature ?? "0x",
    };

    // Do we want to buy from a whitelist-enabled sale and do we have a voucher?
    const method = params.voucher ? "buyUsingVoucher" : "buy";
    const buyTx = await this.saleContract[method](
      // SaleInfo memory _saleInfo
      saleInfo,
      // WhitelistVoucherParams memory voucher - optional
      ...optionalParam(params.voucher != null, {
        ...params.voucher,
        price: voucherPrice,
      }),
      // If currency is Native, send msg.value
      ...optionalParam(isNativeCurrency, {
        value,
      })
    );

    return new EvmTransaction(buyTx);
  }

  public async getSaleParamsHash(params: {
    price: Price;
    ethAddress?: string;
    supply?: number;
    startTime?: Date;
    endTime?: Date;
    isV2?: boolean;
  }) {
    const { price, ethAddress, supply, startTime, endTime, isV2 } = params;

    const paymentToken = this.getPaymentToken(price.currency);
    const isNativeCurrency = this.isNativeCurrency(price.currency);
    const value = this.parseCurrency(price.currency, price.amount);

    const nonceResult: BigNumber = await this.nonceContract.getNonce(
      this.item.contractAddress,
      this.item.tokenId,
      ethAddress
    );

    const hashParams = [
      // address _token
      this.item.contractAddress,
      // uint256 _tokenId
      this.item.tokenId,
      // address _payToken - Remove the payment token when we pay in BNB. To keep supporting signatures before multi-currency support which are inherently BNB
      ...optionalParam(!isNativeCurrency || isV2, paymentToken),
      // uint256 price
      value,
      // uint256 _selling
      ...optionalParam(
        supply != null || isV2,
        supply ?? 1 // selling
      ),
      // uint256 nonce
      nonceResult.toNumber(),

      ...optionalParam(isV2, getUnixEpochTimeStampFromDateOr0(startTime)),
      ...optionalParam(isV2, getUnixEpochTimeStampFromDateOr0(endTime)),
    ];

    return soliditySha3(...(hashParams as string[]));
  }
}
