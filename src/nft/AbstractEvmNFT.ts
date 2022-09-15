import assert from "assert";
import { BigNumber } from "ethers";
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
import { Platform } from "../platform";
import { RefinableEvmClient } from "../refinable/client/RefinableEvmClient";
import { ContractWrapper } from "../refinable/contract/ContractWrapper";
import { Refinable } from "../refinable/Refinable";
import EvmTransaction from "../transaction/EvmTransaction";
import { Transaction } from "../transaction/Transaction";
import { parseBPS } from "../utils/chain";
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
import { ListStatus, LIST_STATUS_STEP } from "./interfaces/SaleStatusStep";
import { WhitelistVoucherParams } from "./interfaces/Voucher";

export type EvmTokenType = TokenType.Erc1155 | TokenType.Erc721;

export abstract class AbstractEvmNFT extends AbstractNFT {
  protected _item: PartialNFTItem;
  private nftTokenContract: ContractWrapper | null;
  protected readonly refinableEvmClient: RefinableEvmClient;

  constructor(
    public type: EvmTokenType,
    protected readonly refinable: Refinable,
    protected item: PartialNFTItem
  ) {
    super(type, refinable, item);
    this.refinableEvmClient = refinable.evm;
  }

  getSaleContractAddress(): string {
    // Error if User is on a wrong chain, if this is the case, we can just return null
    try {
      return this.saleContract.address;
    } catch {}

    return null;
  }

  get saleContract() {
    const sale = this.refinableEvmClient.contracts.getBaseContract(
      this.item.chainId,
      ContractTypes.Sale
    );

    sale.connect(this.refinable.provider);

    return sale.contractWrapper;
  }

  get auctionContract() {
    const auction = this.refinableEvmClient.contracts.getBaseContract(
      this.item.chainId,
      ContractTypes.Auction
    );

    auction.connect(this.refinable.provider);

    return auction.contractWrapper;
  }

  get nonceContract() {
    const saleNonceHolder = this.refinableEvmClient.contracts.getBaseContract(
      this.item.chainId,
      `${this.type}_SALE_NONCE_HOLDER`
    );

    saleNonceHolder.connect(this.refinable.provider);

    return saleNonceHolder.contractWrapper;
  }

  get transferProxyContract() {
    const transferProxy = this.refinableEvmClient.contracts.getBaseContract(
      this.item.chainId,
      `TRANSFER_PROXY`
    );

    transferProxy.connect(this.refinable.provider);

    return transferProxy.contractWrapper;
  }

  get airdropContract() {
    const airdrop = this.refinableEvmClient.contracts.getBaseContract(
      this.item.chainId,
      `${this.type}_AIRDROP`
    );

    airdrop?.connect(this.refinable.provider);

    return airdrop?.contractWrapper;
  }

  public async getTokenContractWrapper() {
    if (this.nftTokenContract) return this.nftTokenContract;

    const isERC1155 = isERC1155Item(this);
    const type = isERC1155
      ? [ContractTypes.Erc1155Token, ContractTypes.Erc1155WhitelistedToken]
      : [
          ContractTypes.Erc721Token,
          ContractTypes.Erc721WhitelistedToken,
          ContractTypes.Erc721LazyMintToken,
        ];

    const nftTokenContract =
      await this.refinableEvmClient.contracts.getRefinableContract(
        this.item.chainId,
        this.item.contractAddress,
        type
      );

    nftTokenContract.connect(this.refinable.provider);

    this.nftTokenContract = nftTokenContract.contractWrapper;

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
    platforms?: Platform[];
    onInitialize?: (
      steps: { step: LIST_STATUS_STEP; platform: Platform }[]
    ) => void;
    onProgress?: <T extends ListStatus>(status: T) => void;
    onError?: (
      { step, platform }: { step: LIST_STATUS_STEP; platform: Platform },
      error
    ) => void;
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

  public async getBuyServiceFee(
    contractAddress: string,
    marketConfigData: string = "0x",
    marketConfigDataSignature: string = "0x"
  ): Promise<number> {
    const serviceFeeContract = this.refinable.evm.contracts.getBaseContract(
      this.item.chainId,
      ContractTypes.ServiceFeeV2
    );

    const fees: LibPart[] = await serviceFeeContract
      .connect(this.refinable.provider)
      .contractWrapper.contract.getServiceFees(
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

  /**
   *  == SALE ==
   */

  async getSaleId() {
    return this.saleContract.contract.getID(
      this.refinable.accountAddress,
      this.item.contractAddress,
      this.item.tokenId
    );
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
    const response = await this.saleContract.sendTransaction(
      method,
      [
        // SaleInfo memory _saleInfo
        saleInfo,
        // WhitelistVoucherParams memory voucher - optional
        ...optionalParam(params.voucher != null, {
          ...params.voucher,
          price: voucherPrice,
        }),
      ],
      {
        // If currency is Native, send msg.value
        ...(isNativeCurrency && {
          value,
        }),
      }
    );

    return response;
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

    const nonceResult: BigNumber = await this.nonceContract.contract.getNonce(
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

  async cancelSale(): Promise<EvmTransaction> {
    this.verifyItem();

    const response = await this.saleContract.sendTransaction("cancel", [
      this.item.contractAddress,
      this.item.tokenId,
    ]);

    return response;
  }

  /**
   *  == AUCTION ==
   */

  async getAuctionId(auctionContractAddress: string): Promise<string> {
    const { contractWrapper } = await this._getAuctionContract(
      auctionContractAddress
    );

    return contractWrapper.contract.getAuctionId(
      this.item.contractAddress,
      this.item.tokenId,
      this.refinable.accountAddress
    );
  }

  async getMinBidIncrement(auctionContractAddress: string): Promise<number> {
    const { contract, contractWrapper } = await this._getAuctionContract(
      auctionContractAddress
    );

    if (contract.hasTagSemver("AUCTION", "<3.1.0")) {
      return 0;
    }
    const minBidIncrementBps: BigNumber =
      await contractWrapper.contract.minBidIncrementBps();

    return parseBPS(minBidIncrementBps) / 100;
  }

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
    const { contractWrapper } = await this._getAuctionContract();

    const addressToApprove = this.auctionContract.address;
    await this.approveIfNeeded(addressToApprove);

    const startPrice = this.parseCurrency(price.currency, price.amount);
    const paymentToken = this.getPaymentToken(price.currency);

    const response = await contractWrapper.sendTransaction("createAuction", [
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
      getUnixEpochTimeStampFromDate(auctionEndDate),
    ]);

    const result =
      await this.refinable.graphqlClient.request<CreateOfferForEditionsMutation>(
        CREATE_OFFER,
        {
          input: {
            chainId: this.item.chainId,
            tokenId: this.item.tokenId,
            contractAddress: this.item.contractAddress,
            type: OfferType.Auction,
            price,
            supply: 1,
            offerContractAddress: this.auctionContract.address,
            transactionHash: response.txId,
            startTime: auctionStartDate,
            endTime: auctionEndDate,
          },
        }
      );

    const offer = this.refinable.offer.createOffer<AuctionOffer>(
      result.createOfferForItems,
      this
    );

    return {
      txResponse: response,
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

    const { contract, contractWrapper } = await this._getAuctionContract(
      auctionContractAddress
    );

    if (contract.hasTag(ContractTag.AuctionV1_0_0))
      throw new Error("No longer supported");

    let auctionIdOrFetch = auctionId;

    if (!auctionId) {
      auctionIdOrFetch = await this.getAuctionId(auctionContractAddress);
    }

    assert(!!auctionIdOrFetch, "AuctionId must be defined");

    const bidAmount = this.parseCurrency(price.currency, price.amount);

    const response = await contractWrapper.sendTransaction(
      "placeBid",
      [
        auctionIdOrFetch,
        ...optionalParam(
          contract.hasTagSemver("AUCTION", ">=5.0.0"),
          bidAmount, // uint256 bidAmount
          marketConfig.data ?? "0x",
          marketConfig.signature ?? "0x"
        ),
      ],
      {
        // If currency is Native, send msg.value
        ...(this.isNativeCurrency(priceWithServiceFee.currency) && {
          value,
        }),
      }
    );

    return response;
  }

  /**
   * Ends an Auction where time has run out. Ending an auction will transfer the nft to the winning bid.
   * @param params NFTEndAuctionParams
   * @returns
   */
  async endAuction(params: NFTEndAuctionParams): Promise<EvmTransaction> {
    const { auctionContractAddress, ownerEthAddress, marketConfig, auctionId } =
      params;

    const { contract, contractWrapper } = await this._getAuctionContract(
      auctionContractAddress
    );

    if (contract.hasTag(ContractTag.AuctionV1_0_0)) {
      return await contractWrapper.sendTransaction("endAuction", [
        // uint256 tokenId
        this.item.tokenId,
        ownerEthAddress,
      ]);
    }
    let auctionIdOrFetch = auctionId;

    if (!auctionId) {
      auctionIdOrFetch = await this.getAuctionId(auctionContractAddress);
    }

    assert(!!auctionIdOrFetch, "AuctionId must be defined");

    return await contractWrapper.sendTransaction("endAuction", [
      auctionIdOrFetch,
      ...optionalParam(
        contract.hasTagSemver("AUCTION", ">=5.0.0"),
        marketConfig.data ?? "0x",
        marketConfig.signature ?? "0x"
      ),
    ]);
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
    const { contract, contractWrapper } = await this._getAuctionContract(
      auctionContractAddress
    );

    if (contract.hasTag(ContractTag.AuctionV1_0_0)) {
      return await contractWrapper.sendTransaction("cancelAuction", [
        // uint256 tokenId
        this.item.tokenId,
        ownerEthAddress,
      ]);
    }

    if (!auctionId) {
      auctionId = await this.getAuctionId(auctionContractAddress);
    }

    assert(!!auctionId, "AuctionId must be defined");

    return await contractWrapper.sendTransaction("cancelAuction", [auctionId]);
  }

  private async _getAuctionContract(
    contractAddress: string = this.auctionContract.address
  ) {
    const auctionContract =
      await this.refinable.evm.contracts.getRefinableContract(
        this.item.chainId,
        contractAddress,
        [
          ContractTypes.Auction,
          ContractTypes.Erc1155Auction,
          ContractTypes.Erc721Auction,
        ]
      );

    auctionContract.connect(this.refinable.evm.providerOrSigner);

    return {
      contract: auctionContract,
      contractWrapper: auctionContract.contractWrapper,
    };
  }

  /**
   *  == MISC ACTIONS ==
   */

  public async approveIfNeeded(
    operatorAddress: string,
    approvingCallback?: () => void
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
      if (approvingCallback) {
        approvingCallback();
      }
      const approvalResult = await this.approve(operatorAddress);

      return approvalResult;
    }
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

    const response = await this.airdropContract.sendTransaction("airdrop", [
      this.item.contractAddress,
      tokenIds,
      recipients,
    ]);

    return response;
  }
}
