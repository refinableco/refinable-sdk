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
import serviceFeeProxyABI from "../abi/serviceFeeProxy.abi.json";
import { CREATE_OFFER } from "../graphql/sale";
import { IChainConfig } from "../interfaces/Config";
import { AuctionOffer } from "../offer/AuctionOffer";
import { SaleOffer } from "../offer/SaleOffer";
import { RefinableEvmClient } from "../refinable/RefinableEvmClient";
import EvmTransaction from "../transaction/EvmTransaction";
import { Transaction } from "../transaction/Transaction";
import { getSupportedCurrency, parseBPS } from "../utils/chain";
import { isERC1155Item } from "../utils/is";
import {
  getUnixEpochTimeStampFromDate,
  getUnixEpochTimeStampFromDateOr0,
} from "../utils/time";
import { optionalParam } from "../utils/utils";
import { AbstractNFT, PartialNFTItem } from "./AbstractNFT";
import { ERCSaleID } from "./ERCSaleId";
import { SaleInfo, SaleVersion } from "./interfaces/SaleInfo";
import { WhitelistVoucherParams } from "./interfaces/Voucher";

export type EvmTokenType = TokenType.Erc1155 | TokenType.Erc721;

export abstract class AbstractEvmNFT extends AbstractNFT {
  protected _item: PartialNFTItem;
  protected _chain: IChainConfig;

  private nftTokenContract: Contract | null;

  constructor(
    public type: EvmTokenType,
    protected readonly refinable: RefinableEvmClient,
    protected item: PartialNFTItem
  ) {
    super(type, refinable, item);
  }

  get auctionType() {
    return isERC1155Item(this)
      ? ContractTypes.Erc1155Auction
      : ContractTypes.Erc721Auction;
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
    const sale = this.refinable.contracts.getBaseContract(
      this.item.chainId,
      ContractTypes.Sale
    );

    return sale.toEthersContract();
  }

  get auctionContract(): Contract {
    const auction = this.refinable.contracts.getBaseContract(
      this.item.chainId,
      this.auctionType
    );

    return auction.toEthersContract();
  }

  get nonceContract(): Contract {
    const saleNonceHolder = this.refinable.contracts.getBaseContract(
      this.item.chainId,
      `${this.type}_SALE_NONCE_HOLDER`
    );

    return saleNonceHolder.toEthersContract();
  }

  get transferProxyContract(): Contract {
    const transferProxy = this.refinable.contracts.getBaseContract(
      this.item.chainId,
      `TRANSFER_PROXY`
    );

    return transferProxy.toEthersContract();
  }

  get airdropContract(): Contract | null {
    const airdrop = this.refinable.contracts.getBaseContract(
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
      await this.refinable.contracts.getRefinableContract(
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

  protected async approveForTokenIfNeeded(
    price: Price,
    spenderAddress: string
  ): Promise<any> {
    const isNativeCurrency = this.isNativeCurrency(price.currency);

    // When native currency, we do not need to approve
    if (!isNativeCurrency) {
      const currency = getSupportedCurrency(
        this._chain.supportedCurrencies,
        price.currency
      );

      const erc20Contract = new Contract(
        currency.address,
        [`function approve(address _spender, uint256 _value)`],
        this.refinable.provider
      );

      const amount = this.parseCurrency(price.currency, price.amount);

      const approvalResult: TransactionResponse = await erc20Contract.approve(
        spenderAddress,
        amount
      );

      // Wait for 1 confirmation
      await approvalResult.wait(this.refinable.options.waitConfirmations);

      return new EvmTransaction(approvalResult);
    }

    return;
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
    await this.approveIfNeeded(this.auctionContract.address);

    const isERC1155 = isERC1155Item(this);
    const type = isERC1155
      ? [ContractTypes.Erc1155Auction]
      : [ContractTypes.Erc721Auction];

    const currentAuctionContract =
      await this.refinable.contracts.getRefinableContract(
        this.item.chainId,
        this.auctionContract.address,
        type
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
      this.refinable.options.waitConfirmations
    );

    const offer = this.refinable.createOffer<AuctionOffer>(
      result.createOfferForItems,
      this
    );

    return {
      txResponse: new EvmTransaction(blockchainAuctionResponse),
      offer,
    };
  }

  async placeBid(
    auctionContractAddress: string,
    price: Price,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<EvmTransaction> {
    this.verifyItem();

    const isERC1155 = isERC1155Item(this);
    const type = isERC1155
      ? [ContractTypes.Erc1155Auction]
      : [ContractTypes.Erc721Auction];

    const serviceFeeBps = await this.getBuyServiceFee(
      auctionContractAddress,
      this.refinable.accountAddress,
      type
    );

    const priceWithServiceFee = await this.getPriceWithBuyServiceFee(
      price,
      serviceFeeBps
    );

    await this.approveForTokenIfNeeded(
      priceWithServiceFee,
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
      await this.refinable.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress,
        type
      );
    const ethersContracts = currentAuctionContract.toEthersContract();

    let placeBidTx: TransactionResponse;

    if (currentAuctionContract.hasTag(ContractTag.AuctionV1_0_0)) {
      placeBidTx = await ethersContracts.placeBid(
        this.item.tokenId, //tokenId, // uint256 tokenId
        ownerEthAddress,
        ...valueParam
      );
    } else {
      if (!auctionId) {
        auctionId = await this.getAuctionId(auctionContractAddress);
      }

      assert(!!auctionId, "AuctionId must be defined");
      placeBidTx = await ethersContracts.placeBid(auctionId, ...valueParam);
    }

    return new EvmTransaction(placeBidTx);
  }

  async getAuctionId(auctionContractAddress: string): Promise<string> {
    const isERC1155 = isERC1155Item(this);
    const type = isERC1155
      ? [ContractTypes.Erc1155Auction]
      : [ContractTypes.Erc721Auction];

    const currentAuctionContract =
      await this.refinable.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress,
        type
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
    const isERC1155 = isERC1155Item(this);
    const type = isERC1155
      ? [ContractTypes.Erc1155Auction]
      : [ContractTypes.Erc721Auction];

    const currentAuctionContract =
      await this.refinable.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress,
        type
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
   * @param auctionContractAddress The contractAddress for the auction contract you are interacting with
   * @param auctionId The auction identifier bound to the owner and token address and id
   * @param ownerEthAddress
   */
  async endAuction(
    auctionContractAddress: string,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<EvmTransaction> {
    const isERC1155 = isERC1155Item(this);
    const type = isERC1155
      ? [ContractTypes.Erc1155Auction]
      : [ContractTypes.Erc721Auction];

    const currentAuctionContract =
      await this.refinable.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress,
        type
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
      if (!auctionId) {
        auctionId = await this.getAuctionId(auctionContractAddress);
      }

      assert(!!auctionId, "AuctionId must be defined");

      endAuctionTx = await ethersContract.endAuction(auctionId);
    }

    return new EvmTransaction(endAuctionTx);
  }

  async cancelSale(params: {
    price?: Price;
    signature?: string;
    selling?: number;
  }): Promise<EvmTransaction> {
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
    serviceFeeUserAddress: string,
    address: string,
    type: ContractTypes[]
  ): Promise<number> {
    const contract = await this.refinable.contracts.getRefinableContract(
      this.item.chainId,
      serviceFeeUserAddress,
      type
    );
    // Get ServiceFeeProxyAddress from user contract (sale or auction)
    const serviceFeeUserContract = new Contract(
      serviceFeeUserAddress,
      [
        {
          inputs: [],
          name: "serviceFeeProxy",
          outputs: [
            {
              name: "",
              type: "address",
            },
          ],
          stateMutability: "view",
          type: "function",
          constant: true,
        },
      ],
      this.refinable.provider
    );

    const serviceFeeProxyAddress =
      await serviceFeeUserContract.serviceFeeProxy();

    if (!serviceFeeProxyAddress)
      throw new Error(
        `Unable to fetch serviceFeeProxy from address ${serviceFeeUserAddress}`
      );

    const serviceFeeProxyContract = new Contract(
      serviceFeeProxyAddress,
      serviceFeeProxyABI,
      this.refinable.provider
    );

    const serviceFee: BigNumber =
      await serviceFeeProxyContract.getBuyServiceFeeBps(address);

    return parseBPS(serviceFee);
  }

  public async getPriceWithBuyServiceFee(
    price: Price,
    serviceFeeBps: number,
    amount = 1
  ): Promise<Price> {
    const currency = this.getCurrency(price.currency);

    // We need to do this because of the rounding in our contracts
    const weiAmount = utils
      .parseUnits(price.amount.toString(), currency.decimals)
      .mul(10000 + serviceFeeBps)
      .div(10000)
      .toString();

    return {
      ...price,
      amount: Number(utils.formatUnits(weiAmount, currency.decimals)) * amount,
    };
  }

  async getMinBidIncrement(auctionContractAddress: string): Promise<number> {
    const isERC1155 = isERC1155Item(this);
    const type = isERC1155
      ? [ContractTypes.Erc1155Auction]
      : [ContractTypes.Erc721Auction];

    const currentAuctionContract =
      await this.refinable.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress,
        type
      );

    const ethersContract = currentAuctionContract.toEthersContract();

    if (currentAuctionContract.hasTagSemver("AUCTION", "<3.1.0")) {
      return 0;
    }
    const isDiamondContract = currentAuctionContract.hasTagSemver(
      "AUCTION",
      ">=4.0.0"
    );
    const minBidIncrementBps: BigNumber = isDiamondContract
      ? await ethersContract.getMinBidIncrementBps()
      : await ethersContract.minBidIncrementBps();

    return parseBPS(minBidIncrementBps) / 100;
  }

  public async approveIfNeeded(
    operatorAddress: string
  ): Promise<Transaction | null> {
    const isContractDeployed =
      await this.refinable.contracts.isContractDeployed(operatorAddress);

    if (!isContractDeployed) {
      throw new Error(
        `OperatContract at address ${operatorAddress} is not deployed`
      );
    }

    const isApproved = await this.isApproved(operatorAddress);

    if (!isApproved) {
      const approvalResult = await this.approve(operatorAddress);

      // Wait for confirmations
      await approvalResult.wait(this.refinable.options.waitConfirmations);

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
    voucher?: WhitelistVoucherParams & { startTime: Date };
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

    const priceWithServiceFee = await this.getPriceWithBuyServiceFee(
      pricePerCopy,
      marketConfig.buyServiceFeeBps.value,
      amount
    );

    await this.approveForTokenIfNeeded(
      priceWithServiceFee,
      this.saleContract.address
    );

    const paymentToken = this.getPaymentToken(pricePerCopy.currency);
    const isNativeCurrency = this.isNativeCurrency(pricePerCopy.currency);
    const value = this.parseCurrency(
      pricePerCopy.currency,
      priceWithServiceFee.amount
    );
    const price = this.parseCurrency(
      pricePerCopy.currency,
      pricePerCopy.amount
    );

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
        startTime: getUnixEpochTimeStampFromDateOr0(params.voucher?.startTime),
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
