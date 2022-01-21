import {
  PurchaseItemMutation,
  PurchaseItemMutationVariables,
} from "../@types/graphql";
import { PURCHASE_ITEM } from "../graphql/sale";
import { AbstractNFT } from "../nft/AbstractNFT";
import { RefinableBaseClient } from "../refinable/RefinableBaseClient";
import { Offer, PartialOffer } from "./Offer";

interface BuyParams {
  royaltyContractAddress?: string;
  amount?: number;
}

export class SaleOffer extends Offer {
  constructor(refinable: RefinableBaseClient, offer: PartialOffer, nft: AbstractNFT) {
    super(refinable, offer, nft);
  }

  public async buy(params?: BuyParams) {
    const amount = params.amount ?? 1;

    const result = await this.nft.buy({
      signature: this.signature,
      price: this.price,
      ownerEthAddress: this.user?.ethAddress,
      royaltyContractAddress: params.royaltyContractAddress,
      supply: this.totalSupply,
      amount,
      blockchainId: this.blockchainId,
    });

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

    return result;
  }

  public cancelSale() {
    return this.nft.cancelSale({
      blockchainId: this.blockchainId,
    });
  }
}
