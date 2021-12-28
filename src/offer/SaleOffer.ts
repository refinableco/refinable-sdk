import {
  PurchaseItemMutation,
  PurchaseItemMutationVariables,
} from "../@types/graphql";
import { PURCHASE_ITEM } from "../graphql/sale";
import { AbstractNFT } from "../nft/AbstractNFT";
import { Refinable } from "../Refinable";
import { Offer, PartialOffer } from "./Offer";

interface BuyParams {
  royaltyContractAddress?: string;
  amount?: number;
}

export class SaleOffer extends Offer {
  constructor(refinable: Refinable, offer: PartialOffer, nft: AbstractNFT) {
    super(refinable, offer, nft);
  }

  public async buy(params?: BuyParams) {
    const amount = params.amount ?? 1;

    const result = await this.nft.buy(
      this.signature,
      this.price,
      this.user?.ethAddress,
      params.royaltyContractAddress,
      this.totalSupply,
      amount
    );

    await this.refinable.apiClient.request<
      PurchaseItemMutation,
      PurchaseItemMutationVariables
    >(PURCHASE_ITEM, {
      input: {
        offerId: this.id,
        amount,
        transactionHash: result.hash,
      },
    });

    return result;
  }

  public cancelSale() {
    return this.nft.cancelSale(this.price, this.signature);
  }
}
