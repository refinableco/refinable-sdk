import { ERC1155NFT, ERC721NFT } from "..";
import {
  Price,
  PurchaseItemMutation,
  PurchaseItemMutationVariables,
  PurchaseMetadata,
} from "../@types/graphql";
import { PURCHASE_ITEM } from "../graphql/sale";
import { AbstractNFT } from "../nft/AbstractNFT";
import { Refinable } from "../Refinable";
import { Offer, PartialOffer } from "./Offer";
import { Buffer } from "buffer";
import { ethers } from "ethers";

interface BuyParams {
  royaltyContractAddress?: string;
  amount?: number;
}

export class SaleOffer extends Offer {
  constructor(refinable: Refinable, offer: PartialOffer, nft: AbstractNFT) {
    super(refinable, offer, nft);
  }

  public async buy(params?: BuyParams, metadata?: PurchaseMetadata) {
    let supply = await this.getSupplyOnSale();

    const amount = params.amount ?? 1;

    const result = await this.nft.buy(
      this.signature,
      this.price,
      this.user?.ethAddress,
      params.royaltyContractAddress,
      supply,
      amount
    );

    if (metadata) {
      metadata.createdAt = new Date();
    }

    await this.refinable.apiClient.request<
      PurchaseItemMutation,
      PurchaseItemMutationVariables
    >(PURCHASE_ITEM, {
      input: {
        offerId: this.id,
        amount,
        transactionHash: result.hash,
        metadata,
      },
    });

    return result;
  }

  public async cancelSale() {
    let selling = await this.getSupplyOnSale();

    return this.nft.cancelSale(this.price, this.signature, selling);
  }

  /**
   * We need this as a fix to support older signatures where we sent the total supply rather than the offer supply
   */
  private async getSupplyOnSale() {
    if (this.nft instanceof ERC721NFT) return 1;

    const saleParamsWithOfferSupply = await this.nft.getSaleParamsHash(
      this.price,
      this.user?.ethAddress,
      this.totalSupply
    );

    const address = ethers.utils.verifyMessage(
      // For some reason we need to remove 0x and parse it as buffer for it to work
      Buffer.from(saleParamsWithOfferSupply.slice(2), "hex"),
      this.signature
    );

    return address.toLowerCase() === this.user?.ethAddress.toLowerCase()
      ? this.totalSupply
      : this.nft.getItem().totalSupply;
  }
}
