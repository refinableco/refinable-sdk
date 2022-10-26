import {
  PlaceAuctionBidMutation,
  PlaceAuctionBidMutationVariables,
} from "../@types/graphql";
import { PLACE_AUCTION_BID } from "../graphql/auction";
import { AbstractNFT } from "../nft/AbstractNFT";
import { IOffer } from "../nft/interfaces/Offer";
import { IPrice } from "../nft/interfaces/Price";
import { Refinable } from "../refinable/Refinable";
import { Offer } from "./Offer";

export class AuctionOffer extends Offer {
  constructor(refinable: Refinable, offer: IOffer, nft: AbstractNFT) {
    super(refinable, offer, nft);
  }

  public async placeBid(price: IPrice) {
    const result = await this.nft.placeBid({
      auctionContractAddress: this._offer.auction.auctionContractAddress,
      price,
      auctionId: this._offer.auction.auctionId,
      marketConfig: this._offer.marketConfig,
    });

    await this.refinable.graphqlClient.request<
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
    return this.nft.endAuction({
      auctionContractAddress: this._offer.auction.auctionContractAddress,
      ownerEthAddress: this._offer.user.ethAddress,
      auctionId: this._offer.auction.auctionId,
      marketConfig: this._offer.marketConfig,
    });
  }
}
