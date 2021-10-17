import {
  PlaceAuctionBidMutation,
  PlaceAuctionBidMutationVariables,
  Price,
} from "../@types/graphql";
import { PLACE_AUCTION_BID } from "../graphql/auction";
import { AbstractNFT } from "../nft/AbstractNFT";
import { Refinable } from "../Refinable";
import { Offer, PartialOffer } from "./Offer";

export class AuctionOffer extends Offer {
  constructor(refinable: Refinable, offer: PartialOffer, nft: AbstractNFT) {
    super(refinable, offer, nft);
  }

  public async placeBid(price: Price) {
    const result = await this.nft.placeBid(
      this.auction.auctionContractAddress,
      price,
      this.auction.auctionId,
      this.user.ethAddress
    );

    await this.refinable.apiClient.request<
      PlaceAuctionBidMutation,
      PlaceAuctionBidMutationVariables
    >(PLACE_AUCTION_BID, {
      input: {
        transactionHash: result.hash,
        bidAmount: price.amount,
        auctionId: this.auction.id,
      },
    });

    return result;
  }

  public cancelAuction() {
    return this.nft.cancelAuction(
      this.auction.auctionContractAddress,
      this.auction.auctionId,
      this.user.ethAddress
    );
  }

  public endAuction() {
    return this.nft.endAuction(
      this.auction.auctionContractAddress,
      this.auction.auctionId,
      this.user.ethAddress
    );
  }
}
