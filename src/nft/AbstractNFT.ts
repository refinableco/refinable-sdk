/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import assert from "assert";
import { BigNumber, constants, Contract, utils } from "ethers";
import { soliditySha3 } from "web3-utils";
import { AuctionOffer } from "../offer/AuctionOffer";
import { SaleOffer } from "../offer/SaleOffer";
import { Refinable } from "../Refinable";
import {
  ContractTag,
  CreateOfferForEditionsMutation,
  OfferType,
  Price,
  PriceCurrency,
  TokenType,
} from "../@types/graphql";
import serviceFeeProxyABI from "../abi/serviceFeeProxy.abi.json";
import { chainMap } from "../config/chains";
import { CREATE_OFFER } from "../graphql/sale";
import { IChainConfig } from "../interfaces/Config";
import { getSupportedCurrency, parseBPS } from "../utils/chain";
import { getUnixEpochTimeStampFromDate } from "../utils/time";
import { optionalParam } from "../utils/utils";
export interface PartialNFTItem {
  contractAddress: string;
  chainId: number;
  tokenId: string;
  supply?: number;
  totalSupply?: number;
}
export abstract class AbstractNFT {
  protected _item: PartialNFTItem;
  protected _chain: IChainConfig;

  private nftTokenContract: Contract | null;

  constructor(
    protected type: TokenType,
    protected refinable: Refinable,
    protected item: PartialNFTItem
  ) {
    if (!chainMap[item.chainId]) {
      throw new Error(`Chain ${item.chainId} is not supported`);
    }

    this._item = item;
    this._chain = chainMap[item.chainId];
  }

  getSaleContractAddress(): string {
    return this.saleContract.address;
  }

  get saleContract(): Contract {
    const sale = this.refinable.contracts.getBaseContract(
      this.item.chainId,
      `${this.type}_SALE`
    );

    return sale.toEthersContract();
  }

  get auctionContract(): Contract {
    const auction = this.refinable.contracts.getBaseContract(
      this.item.chainId,
      `${this.type}_AUCTION`
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

    const nftTokenContract =
      await this.refinable.contracts.getRefinableContract(
        this.item.chainId,
        this.item.contractAddress
      );

    this.nftTokenContract = nftTokenContract.toEthersContract();

    return this.nftTokenContract;
  }

  public getItem() {
    return this.item;
  }

  public setItem(item: PartialNFTItem): void {
    this.item = item;
  }

  verifyItem() {
    if (!this.item) throw new Error("Unable to do this action, item required");
  }

  abstract isApproved(operatorAddress?: string): Promise<boolean>;
  abstract approve(operatorAddress?: string): Promise<TransactionResponse>;
  abstract burn(
    supply?: number,
    ownerEthAddress?: string
  ): Promise<TransactionResponse>;
  abstract putForSale(price: Price, supply?: number): Promise<SaleOffer>;
  abstract transfer(
    ownerEthAddress: string,
    recipientEthAddress: string,
    supply?: number
  ): Promise<TransactionResponse>;
  abstract buy(
    signature: string,
    price: Price,
    ownerEthAddress: string,
    royaltyContractAddress?: string,
    supply?: number,
    amount?: number
  ): Promise<TransactionResponse>;

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
    }

    return Promise.resolve();
  }

  async putForAuction({
    price,
    auctionStartDate,
    auctionEndDate,
    royaltyContractAddress,
  }: {
    price: Price;
    auctionStartDate: Date;
    auctionEndDate: Date;
    royaltyContractAddress?: string;
  }): Promise<{
    txResponse: TransactionResponse;
    offer: AuctionOffer;
  }> {
    await this.isValidRoyaltyContract(royaltyContractAddress);

    await this.approveIfNeeded(this.auctionContract.address);

    const startPrice = this.parseCurrency(price.currency, price.amount);
    const paymentToken = this.getPaymentToken(price.currency);

    const blockchainAuctionResponse = await this.auctionContract.createAuction(
      // address _token
      this.item.contractAddress,
      // address _royaltyToken
      royaltyContractAddress ?? constants.AddressZero,
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

    const offer = this.refinable.createOffer<OfferType.Auction>(
      { ...result.createOfferForItems, type: OfferType.Auction },
      this
    );

    return {
      txResponse: blockchainAuctionResponse,
      offer,
    };
  }

  cancelSale(): Promise<TransactionResponse> {
    if (!this.item.tokenId) {
      throw new Error("tokenId is not set");
    }

    if (!this.item.contractAddress) {
      throw new Error("contract address is not set");
    }

    this.verifyItem();
    return this.saleContract.cancel(
      this.item.contractAddress,
      this.item.tokenId //tokenId, // uint256 tokenId
    );
  }

  async placeBid(
    auctionContractAddress: string,
    price: Price,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<TransactionResponse> {
    this.verifyItem();

    const priceWithServiceFee = await this.getPriceWithBuyServiceFee(
      price,
      auctionContractAddress
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
        auctionContractAddress
      );
    const ethersContracts = currentAuctionContract.toEthersContract();

    let result: TransactionResponse;

    if (currentAuctionContract.hasTag(ContractTag.AuctionV1_0_0)) {
      result = await ethersContracts.placeBid(
        this.item.tokenId, //tokenId, // uint256 tokenId
        ownerEthAddress,
        ...valueParam
      );
    } else {
      if (!auctionId) {
        auctionId = await this.getAuctionId(auctionContractAddress);
      }

      assert(!!auctionId, "AuctionId must be defined");

      result = await ethersContracts.placeBid(auctionId, ...valueParam);
    }

    return result;
  }

  async getAuctionId(auctionContractAddress: string): Promise<string> {
    const currentAuctionContract =
      await this.refinable.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress
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
  ): Promise<TransactionResponse> {
    const currentAuctionContract =
      await this.refinable.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress
      );

    const ethersContract = currentAuctionContract.toEthersContract();

    if (currentAuctionContract.hasTag(ContractTag.AuctionV1_0_0)) {
      return ethersContract.cancelAuction(
        // uint256 tokenId
        this.item.tokenId,
        ownerEthAddress
      );
    } else {
      if (!auctionId) {
        auctionId = await this.getAuctionId(auctionContractAddress);
      }

      assert(!!auctionId, "AuctionId must be defined");

      return ethersContract.cancelAuction(auctionId);
    }
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
  ): Promise<TransactionResponse> {
    const currentAuctionContract =
      await this.refinable.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress
      );

    const ethersContract = currentAuctionContract.toEthersContract();

    if (currentAuctionContract.hasTag(ContractTag.AuctionV1_0_0)) {
      return ethersContract.endAuction(
        // uint256 tokenId
        this.item.tokenId,
        ownerEthAddress
      );
    } else {
      if (!auctionId) {
        auctionId = await this.getAuctionId(auctionContractAddress);
      }

      assert(!!auctionId, "AuctionId must be defined");

      return ethersContract.endAuction(auctionId);
    }
  }

  async airdrop(recipients: string[]): Promise<TransactionResponse> {
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

    const result = this.airdropContract.airdrop(
      this.item.contractAddress,
      tokenIds,
      recipients
    );

    return result;
  }

  public async getBuyServiceFee(
    serviceFeeUserAddress: string,
    address: string
  ): Promise<number> {
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
    contractAddress: string,
    amount = 1
  ): Promise<Price> {
    const serviceFeeBps = await this.getBuyServiceFee(
      contractAddress,
      this.refinable.accountAddress
    );

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
    const currentAuctionContract =
      await this.refinable.contracts.getRefinableContract(
        this.item.chainId,
        auctionContractAddress
      );

    const ethersContract = currentAuctionContract.toEthersContract();

    if (currentAuctionContract.hasTagSemver("AUCTION", "<3.1.0")) {
      return 0;
    }

    const minBidIncrementBps: BigNumber =
      await ethersContract.minBidIncrementBps();

    return parseBPS(minBidIncrementBps) / 100;
  }

  protected getPaymentToken(priceCurrency: PriceCurrency) {
    const currency = this._chain.supportedCurrencies.find(
      (c) => c.symbol === priceCurrency
    );

    if (!currency) throw new Error("Unsupported currency");

    return currency.address;
  }

  protected async isValidRoyaltyContract(royaltyContractAddress?: string) {
    if (!royaltyContractAddress) return false;

    const isCustomRoyaltyContractDeployed =
      royaltyContractAddress != null &&
      (await this.refinable.contracts.isContractDeployed(
        royaltyContractAddress
      ));

    // Verify Royalty address
    if (royaltyContractAddress && !isCustomRoyaltyContractDeployed) {
      throw new Error(
        `RoyaltyContract at address ${royaltyContractAddress} is not deployed`
      );
    }
  }

  protected async approveIfNeeded(
    operatorAddress: string
  ): Promise<TransactionResponse | null> {
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

  protected async getSaleParamsHash(
    price: Price,
    ethAddress?: string,
    supply?: number
  ) {
    const paymentToken = this.getPaymentToken(price.currency);
    const isNativeCurrency = this.isNativeCurrency(price.currency);
    const value = this.parseCurrency(price.currency, price.amount);

    const nonceResult: BigNumber = await this.nonceContract.getNonce(
      this.item.contractAddress,
      this.item.tokenId,
      ethAddress
    );

    const params = [
      // address _token
      this.item.contractAddress,
      // uint256 _tokenId
      this.item.tokenId,
      // address _payToken - Remove the payment token when we pay in BNB. To keep supporting signatures before multi-currency support which are inherently BNB
      ...optionalParam(!isNativeCurrency, paymentToken),
      // uint256 price
      value,
      // uint256 _selling
      ...optionalParam(
        supply != null,
        supply // selling
      ),
      // uint256 nonce
      nonceResult.toNumber(),
    ];

    return soliditySha3(...(params as string[]));
  }

  protected getCurrency(priceCurrency: PriceCurrency) {
    return getSupportedCurrency(this._chain.supportedCurrencies, priceCurrency);
  }

  protected isNativeCurrency(priceCurrency: PriceCurrency) {
    const currency = this.getCurrency(priceCurrency);

    return currency && currency.native === true;
  }
  protected parseCurrency(priceCurrency: PriceCurrency, amount: number) {
    const currency = this.getCurrency(priceCurrency);

    return utils.parseUnits(amount.toString(), currency.decimals).toString();
  }
}
