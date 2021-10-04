/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber, Contract, ethers } from "ethers";
import { soliditySha3, toWei } from "web3-utils";
import { ContractType, Refinable } from "../Refinable";
import { TOKEN_TYPE } from "./nft";
import { Price } from "../constants/currency";
import { optionalParam } from "../utils";
import { IRoyalty } from "./royaltyStrategies/Royalty";
import {
  CreateItemInput,
  PriceCurrency,
  GetUserOfferItemsQuery,
  GetUserOfferItemsQueryVariables,
} from "../@types/graphql";
import { ReadStream } from "fs";
import { getUnixEpochTimeStampFromDate } from "../utils/time";
import { getApproveContract } from "../contracts";
import { CREATE_OFFER } from "../graphql/sale";
import { IChainConfig } from "../interfaces/Config";
import { chainMap } from "../chains";
import { getSupportedCurrency } from "../utils/chain";
import { GET_USER_OFFER_ITEMS } from "../graphql/items";

export interface PartialNFTItem {
  contractAddress: string;
  chainId: number;
  tokenId?: string;
}

export interface NftValues
  extends Omit<CreateItemInput, "file" | "contractAddress" | "type"> {
  file: ReadStream;
}

export enum OfferType {
  Sale = "SALE",
  Auction = "AUCTION",
}
export abstract class AbstractNFT {
  protected _types: ContractType[] = [];
  protected _initialized: boolean = false;
  protected _item: PartialNFTItem;
  protected _chain: IChainConfig;

  protected saleContract: Contract;
  protected mintContract: Contract;
  protected nonceContract: Contract;
  protected auctionContract: Contract;
  protected transferProxyContract: Contract;

  constructor(
    protected type: TOKEN_TYPE,
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
    ] as ContractType[];
    this._chain = chainMap[item.chainId];
  }

  public async build(): Promise<this> {
    const { refinableContracts } = await this.refinable.getContracts(
      this.item.chainId,
      this._types
    );

    const refinableContractsMap = refinableContracts.reduce(
      (prev: any, contract: any) => ({ ...prev, [contract.type]: contract }),
      {}
    );

    // Token contract
    this.mintContract = new ethers.Contract(
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
        await this.mintContract.approve(
          spenderAddress,
          toWei(price.amount.toString(), "ether")
        );

      // Wait for 1 confirmation
      await approvalResult.wait(this.refinable.options.waitConfirmations);
    }

    return Promise.resolve();
  }

  protected approveForAll(address: string): Promise<TransactionResponse> {
    return this.mintContract.setApprovalForAll(address, true);
  }

  abstract mint(
    nftValues: NftValues,
    royalty?: IRoyalty
  ): Promise<TransactionResponse>;

  abstract putForSale(price: Price): Promise<string>;

  abstract transfer(
    ownerEthAddress: string,
    recipientEthAddress: string
  ): Promise<TransactionResponse>;

  async putForAuction({
    price,
    auctionStartDate,
    auctionEndDate,
  }: {
    price: Price;
    auctionStartDate: Date;
    auctionEndDate: Date;
  }): Promise<string> {
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

    await blockchainAuctionResponse.wait(
      this.refinable.options.waitConfirmations
    );

    const result = await this.refinable.apiClient.request(CREATE_OFFER, {
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
    });

    return result;
  }

  cancelAuction(auctionId?: string): Promise<TransactionResponse> {
    return this.auctionContract.cancelAuction(auctionId);
  }

  getAuctionId(): Promise<string> {
    return this.auctionContract.getAuctionId(
      this.mintContract.address,
      this.item.tokenId,
      this.refinable.accountAddress
    );
  }

  endAuction(auctionId?: string): Promise<TransactionResponse> {
    return this.auctionContract.endAuction(auctionId);
  }

  async getItemsOnSale(paging = 30): Promise<{}> {
    const queryResponse = await this.refinable.apiClient.request<
      GetUserOfferItemsQuery,
      GetUserOfferItemsQueryVariables
    >(GET_USER_OFFER_ITEMS, {
      ethAddress: this.refinable.accountAddress,
      filter: { type: OfferType.Sale },
      paging: {
        first: paging,
      },
    });
    return queryResponse?.user?.itemsOnOffer;
  }
}
