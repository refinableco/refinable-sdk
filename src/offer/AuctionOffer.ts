import {
  PlaceAuctionBidMutation,
  PlaceAuctionBidMutationVariables,
  Price,
} from "../@types/graphql";
import { PLACE_AUCTION_BID } from "../graphql/auction";
import { AbstractNFT } from "../nft/AbstractNFT";
import { RefinableBaseClient } from "../refinable/RefinableBaseClient";
import { Offer, PartialOffer } from "./Offer";

export class AuctionOffer extends Offer {
  constructor(
    refinable: RefinableBaseClient,
    offer: PartialOffer,
    nft: AbstractNFT
  ) {
    super(refinable, offer, nft);
  }

  public async placeBid(price: Price) {
    const result = await this.nft.placeBid(
      this._offer.auction.auctionContractAddress,
      price,
      this._offer.auction.auctionId,
    );

    await this.refinable.apiClient.request<
      PlaceAuctionBidMutation,
      PlaceAuctionBidMutationVariables
    >(PLACE_AUCTION_BID, {
      input: {
        transactionHash: result.txId,
        bidAmount: price.amount,
        auctionId: this._offer.auction.id,
      },
    });

    return result;
  }

  public cancelAuction() {
    return this.nft.cancelAuction(
      this._offer.auction.auctionContractAddress,
      this._offer.auction.auctionId,
      this._offer.user.ethAddress
    );
  }

  public endAuction() {
    return this.nft.endAuction(
      this._offer.auction.auctionContractAddress,
      this._offer.auction.auctionId,
      this._offer.user.ethAddress
    );
  }
}
