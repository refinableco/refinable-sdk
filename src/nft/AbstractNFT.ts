import { utils } from "ethers";
import {
  MarketConfig,
  Price,
  PriceCurrency,
  RefreshMetadataMutation,
  TokenType,
} from "../@types/graphql";
import { chainMap } from "../config/chains";
import { REFRESH_METADATA } from "../graphql/items";
import { IChainConfig } from "../interfaces/Config";
import { AuctionOffer } from "../offer/AuctionOffer";
import { SaleOffer } from "../offer/SaleOffer";
import { RefinableBaseClient } from "../refinable/RefinableBaseClient";
import { Transaction } from "../transaction/Transaction";
import { getSupportedCurrency } from "../utils/chain";

export interface PartialNFTItem {
  contractAddress: string;
  chainId: number;
  tokenId: string;
  supply?: number;
  totalSupply?: number;
}

export interface NFTBuyParams {
  signature: string;
  price: Price;
  ownerEthAddress: string;
  supply: number;
  amount?: number;
  blockchainId: string;
  startTime?: Date;
  endTime?: Date;
  marketConfig?: MarketConfig;
}

export interface NFTPlaceBidParams {
  auctionContractAddress: string;
  price: Price;
  auctionId?: string;
  marketConfig?: MarketConfig;
}
export interface NFTEndAuctionParams {
  auctionContractAddress: string,
  auctionId?: string,
  ownerEthAddress?: string
  marketConfig?: MarketConfig;
}

export abstract class AbstractNFT {
  protected _item: PartialNFTItem;
  protected _chain: IChainConfig;

  constructor(
    public type: TokenType,
    protected refinable: RefinableBaseClient,
    protected item: PartialNFTItem
  ) {
    if (!chainMap[item.chainId]) {
      throw new Error(`Chain ${item.chainId} is not supported`);
    }

    this._item = item;
    this._chain = chainMap[item.chainId];
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
  }

  abstract cancelSale(params?: {
    blockchainId?: string;
    price?: Price;
    signature?: string;
    selling?: number;
  }): Promise<Transaction>;
  abstract burn(
    supply?: number,
    ownerEthAddress?: string
  ): Promise<Transaction>;
  abstract putForSale(params: {
    price: Price;
    supply?: number;
  }): Promise<SaleOffer>;
  abstract transfer(
    ownerEthAddress: string,
    recipientEthAddress: string,
    supply?: number
  ): Promise<Transaction>;
  abstract buy(params: NFTBuyParams): Promise<Transaction>;

  abstract putForAuction({
    price,
    auctionStartDate,
    auctionEndDate,
  }: {
    price: Price;
    auctionStartDate: Date;
    auctionEndDate: Date;
  }): Promise<{
    txResponse: Transaction;
    offer: AuctionOffer;
  }>;

  abstract placeBid(params: NFTPlaceBidParams): Promise<Transaction>;

  abstract cancelAuction(
    auctionContractAddress: string,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<Transaction>;

  abstract endAuction(params: NFTEndAuctionParams): Promise<Transaction>;

  abstract airdrop(recipients: string[]): Promise<Transaction>;

  async refreshMetadata() {
    this.verifyItem();

    const response =
      await this.refinable.apiClient.request<RefreshMetadataMutation>(
        REFRESH_METADATA,
        {
          input: {
            tokenId: this.item.tokenId,
            contractAddress: this.item.contractAddress,
            chainId: this.item.chainId,
            type: this.type,
          },
        }
      );

    return response.refreshMetadata;
  }

  protected getPaymentToken(priceCurrency: PriceCurrency) {
    const currency = this._chain.supportedCurrencies.find(
      (c) => c.symbol === priceCurrency
    );

    if (!currency) throw new Error("Unsupported currency");

    return currency.address;
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
