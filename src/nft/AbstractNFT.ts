import {
  MarketConfig,
  Price,
  PriceInput,
  RefreshMetadataMutation,
  TokenType,
} from "../@types/graphql";
import { REFRESH_METADATA } from "../graphql/items";
import { AuctionOffer } from "../offer/AuctionOffer";
import { SaleOffer } from "../offer/SaleOffer";
import { Chain } from "../refinable/Chain";
import { Refinable } from "../refinable/Refinable";
import { Transaction } from "../transaction/Transaction";

export interface PartialNFTItem {
  contractAddress: string;
  chainId: number;
  tokenId: string;
  supply?: number;
  totalSupply?: number;
}

export interface NFTBuyParams {
  signature: string;
  price: PriceInput;
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
  price: PriceInput;
  auctionId?: string;
  marketConfig?: MarketConfig;
}
export interface NFTEndAuctionParams {
  auctionContractAddress: string;
  auctionId?: string;
  ownerEthAddress?: string;
  marketConfig?: MarketConfig;
}

export abstract class AbstractNFT {
  protected _item: PartialNFTItem;
  protected _chain: Chain;

  constructor(
    public type: TokenType,
    protected refinable: Refinable,
    protected item: PartialNFTItem
  ) {
    this._item = item;
    this._chain = new Chain(item.chainId);
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
    price?: PriceInput;
    signature?: string;
    selling?: number;
  }): Promise<Transaction>;
  abstract burn(
    supply?: number,
    ownerEthAddress?: string
  ): Promise<Transaction>;
  abstract putForSale(params: {
    price: PriceInput;
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
    price: PriceInput;
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
      await this.refinable.graphqlClient.request<RefreshMetadataMutation>(
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

  protected parseUnits(decimals: number, amount: number) {
    return this._chain.parseUnits(decimals, amount);
  }
}
