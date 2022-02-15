import { Buffer } from "buffer";
import { ethers } from "ethers";
import {
  PurchaseItemMutation,
  PurchaseItemMutationVariables,
} from "../@types/graphql";
import { PURCHASE_ITEM } from "../graphql/sale";
import { AbstractNFT } from "../nft/AbstractNFT";
import { RefinableBaseClient } from "../refinable/RefinableBaseClient";
import { Transaction } from "../transaction/Transaction";
import { isERC1155 } from "../utils/is";
import { Offer, PartialOffer } from "./Offer";

interface BuyParams {
  royaltyContractAddress?: string;
  amount?: number;
}

export class SaleOffer extends Offer {
  constructor(
    refinable: RefinableBaseClient,
    offer: PartialOffer,
    nft: AbstractNFT
  ) {
    super(refinable, offer, nft);
  }

  public async buy(params?: BuyParams) {
    const supply = await this.getSupplyOnSale();
    const amount = params.amount ?? 1;

    const result = await this.nft.buy({
      signature: this.signature,
      price: this.price,
      ownerEthAddress: this.user?.ethAddress,
      royaltyContractAddress: params.royaltyContractAddress,
      supply,
      amount,
      blockchainId: this.blockchainId,
    });

    if (result.txId) {
      await this.refinable.apiClient.request<
        PurchaseItemMutation,
        PurchaseItemMutationVariables
      >(PURCHASE_ITEM, {
        input: {
          offerId: this.id,
          amount,
          transactionHash: result.txId,
        },
      });
    }

    return result;
  }

  public async cancelSale<T extends Transaction = Transaction>(): Promise<T> {
    const selling = await this.getSupplyOnSale();

    return this.nft.cancelSale({
      price: this.price,
      signature: this.signature,
      selling,
      blockchainId: this.blockchainId,
    }) as Promise<T>;
  }

  /**
   * We need this as a fix to support older signatures where we sent the total supply rather than the offer supply
   */
  private async getSupplyOnSale() {
    if (isERC1155(this.nft)) {
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

    return this.totalSupply;
  }
}
