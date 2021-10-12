/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import assert from "assert";
import { BigNumber, Contract, ethers } from "ethers";
import { soliditySha3, toWei } from "web3-utils";
import {
  ContractTypes,
  CreateOfferForEditionsMutation,
  OfferType,
  PriceCurrency,
  TokenType,
} from "../@types/graphql";
import { chainMap } from "../chains";
import { Price } from "../constants/currency";
import { getApproveContract } from "../contracts";
import { CREATE_OFFER } from "../graphql/sale";
import { IChainConfig } from "../interfaces/Config";
import { Refinable } from "../Refinable";
import { optionalParam } from "../utils";
import { getSupportedCurrency } from "../utils/chain";
import { getUnixEpochTimeStampFromDate } from "../utils/time";

export interface PartialNFTItem {
  contractAddress: string;
  chainId: number;
  supply?: number;
  // TODO: should not be optional
  tokenId?: string;
}
export abstract class AbstractNFT {
  protected _types: ContractTypes[] = [];
  protected _initialized: boolean = false;
  protected _item: PartialNFTItem;
  protected _chain: IChainConfig;

  protected saleContract: Contract;
  protected nftTokenContract: Contract;
  protected nonceContract: Contract;
  protected auctionContract: Contract;
  protected airdropContract: Contract;
  protected transferProxyContract: Contract;

  constructor(
    protected type: TokenType,
    protected refinable: Refinable,
    protected item: PartialNFTItem
  ) {
    if (!chainMap[item.chainId]) {
      throw new Error(`Chain ${item.chainId} is not supported`);
    }

    this._item = item;
    this._types = [
      `${type}_TOKEN`,
      `${type}_AUCTION`,
      `${type}_SALE`,
      `${type}_SALE_NONCE_HOLDER`,
      "TRANSFER_PROXY",
    ] as ContractTypes[];
    this._chain = chainMap[item.chainId];
  }

  public async build(): Promise<this> {
    const refinableContracts =
      await this.refinable.contracts.getRefinableContracts(
        this.item.chainId,
        this._types
      );

    const refinableContractsMap = refinableContracts.reduce(
      (prev, contract) => ({ ...prev, [contract.type]: contract }),
      {}
    );

    // Token contract
    this.nftTokenContract = new ethers.Contract(
      refinableContractsMap[`${this.type}_TOKEN`].contractAddress,
      refinableContractsMap[`${this.type}_TOKEN`].contractABI
    ).connect(this.refinable.provider);

    // Sale contract
    this.saleContract = new ethers.Contract(
      refinableContractsMap[`${this.type}_SALE`].contractAddress,
      refinableContractsMap[`${this.type}_SALE`].contractABI
    ).connect(this.refinable.provider);

    // Auction contract
    this.auctionContract = new ethers.Contract(
      refinableContractsMap[`${this.type}_AUCTION`].contractAddress,
      refinableContractsMap[`${this.type}_AUCTION`].contractABI
    ).connect(this.refinable.provider);

    // Nonce contract
    this.nonceContract = new ethers.Contract(
      refinableContractsMap[`${this.type}_SALE_NONCE_HOLDER`].contractAddress,
      refinableContractsMap[`${this.type}_SALE_NONCE_HOLDER`].contractABI
    ).connect(this.refinable.provider);

    // transfer proxy
    this.transferProxyContract = new ethers.Contract(
      refinableContractsMap["TRANSFER_PROXY"].contractAddress,
      refinableContractsMap["TRANSFER_PROXY"].contractABI
    ).connect(this.refinable.provider);

    // Airdrop contract
    // TODO
    // this.airdropContract = new ethers.Contract(
    //   refinableContractsMap[`${this.type}_AIRDROP`].contractAddress,
    //   refinableContractsMap[`${this.type}_AIRDROP`].contractABI
    // ).connect(this.refinable.provider);

    this._initialized = true;

    return this;
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

  protected async approveIfNeeded(
    operatorAddress: string
  ): Promise<TransactionResponse | null> {
    const isApproved = await this.isApproved(operatorAddress);

    if (!isApproved) {
      const approvalResult = await this.approve(operatorAddress);

      // Wait for confirmations
      await approvalResult.wait(this.refinable.options.waitConfirmations);

      return approvalResult;
    }
  }

  abstract isApproved(operatorAddress?: string): Promise<boolean>;
  abstract approve(operatorAddress?: string): Promise<TransactionResponse>;
  abstract burn(supply?: number): Promise<TransactionResponse>;
  abstract putForSale(price: Price, supply?: number): Promise<string>;
  abstract transfer(
    ownerEthAddress: string,
    recipientEthAddress: string
  ): Promise<TransactionResponse>;
  abstract cancelSale(): Promise<TransactionResponse>;

  protected async getSaleParamsHash(
    price: Price,
    ethAddress?: string,
    supply?: number
  ) {
    const value = ethers.utils.parseEther(price.amount.toString()).toString();
    const paymentToken = getSupportedCurrency(
      this._chain.supportedCurrencies,
      price.currency
    ).address;

    const nonceResult: BigNumber = await this.nonceContract.getNonce(
      this.item.contractAddress,
      this.item.tokenId,
      ethAddress
    );

    const params = [
      this.item.contractAddress, // token
      this.item.tokenId, // tokenId
      // Remove the payment token when we pay in BNB. To keep supporting signatures before multi-currency support which are inherently BNB
      ...optionalParam(price.currency !== PriceCurrency.Bnb, paymentToken),
      value, // values.price, // price
      ...optionalParam(
        supply != null,
        supply // selling
      ),
      nonceResult.toNumber(), // nonce
    ];

    const hash = soliditySha3(...(params as string[]));

    return hash;
  }

  protected isNativeCurrency(priceCurrency: PriceCurrency) {
    const currency = getSupportedCurrency(
      this._chain.supportedCurrencies,
      priceCurrency
    );

    return currency && currency.native === true;
  }

  protected async approveForTokenIfNeeded(
    price: Price,
    spenderAddress: string
  ): Promise<any> {
    const isNativeCurrency = this.isNativeCurrency(price.currency);

    // When native currency, we do not need to approve
    if (!isNativeCurrency) {
      const contractAddress = getSupportedCurrency(
        this._chain.supportedCurrencies,
        price.currency
      ).address;
      const erc20Contract = getApproveContract(contractAddress, price.currency);

      if (!erc20Contract) {
        throw new Error(
          `Unable to create ERC20 contract for ${price.currency}`
        );
      }

      const approvalResult: TransactionResponse =
        await this.nftTokenContract.approve(
          spenderAddress,
          toWei(price.amount.toString(), "ether")
        );

      // Wait for 1 confirmation
      await approvalResult.wait(this.refinable.options.waitConfirmations);
    }

    return Promise.resolve();
  }

  protected approveForAll(address: string): Promise<TransactionResponse> {
    return this.nftTokenContract.setApprovalForAll(address, true);
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
    txResponse: TransactionResponse;
    result: CreateOfferForEditionsMutation;
  }> {
    await this.approveIfNeeded(this.auctionContract.address);

    const startPrice = ethers.utils
      .parseEther(price.amount.toString())
      .toString();

    const paymentToken = getSupportedCurrency(
      this._chain.supportedCurrencies,
      price.currency
    ).address;

    const blockchainAuctionResponse = await this.auctionContract.createAuction(
      this.item.contractAddress,
      // TODO: Preparation for V2
      // ethers.constants.AddressZero, // _royaltyToken
      // TODO: Preparation for V2
      this.item.tokenId, //tokenId, // uint256 tokenId
      paymentToken,
      startPrice,
      getUnixEpochTimeStampFromDate(auctionStartDate),
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

    return {
      txResponse: blockchainAuctionResponse,
      result,
    };
  }

  async cancelAuction(auctionId?: string): Promise<TransactionResponse> {
    if (!auctionId) {
      auctionId = await this.getAuctionId();
    }

    return this.auctionContract.cancelAuction(auctionId);
  }

  getAuctionId(): Promise<string> {
    return this.auctionContract.getAuctionId(
      this.nftTokenContract.address,
      this.item.tokenId,
      this.refinable.accountAddress
    );
  }

  async endAuction(auctionId?: string): Promise<TransactionResponse> {
    if (!auctionId) {
      auctionId = await this.getAuctionId();
    }

    return this.auctionContract.endAuction(auctionId);
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

    // const result = this.airdropContract.airdrop(
    //   this.item.contractAddress,
    //   recipients.map(() => this.item.tokenId),
    //   recipients
    // );

    // return result;

    return {} as any;
  }
}
