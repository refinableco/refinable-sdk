/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { utils } from "ethers";
import { Price, PriceCurrency, TokenType } from "../@types/graphql";
import { chainMap } from "../config/chains";
import { IChainConfig } from "../interfaces/Config";
import { AuctionOffer } from "../offer/AuctionOffer";
import { SaleOffer } from "../offer/SaleOffer";
import { RefinableBase } from "../RefinableBase";
import { getSupportedCurrency } from "../utils/chain";
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

  constructor(
    protected type: TokenType,
    protected refinable: RefinableBase,
    protected item: PartialNFTItem
  ) {
    if (!chainMap[item.chainId]) {
      throw new Error(`Chain ${item.chainId} is not supported`);
    }

    this._item = item;
    this._chain = chainMap[item.chainId];
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

  abstract putForAuction({
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
  }>;

  abstract cancelSale(): Promise<TransactionResponse>;

  abstract placeBid(
    auctionContractAddress: string,
    price: Price,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<TransactionResponse>;

  abstract cancelAuction(
    auctionContractAddress: string,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<TransactionResponse>;

  abstract endAuction(
    auctionContractAddress: string,
    auctionId?: string,
    ownerEthAddress?: string
  ): Promise<TransactionResponse>;

  abstract airdrop(recipients: string[]): Promise<TransactionResponse>;

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
