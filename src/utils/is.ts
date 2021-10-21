import { OfferType } from "../@types/graphql";
import { AuctionOffer } from "../offer/AuctionOffer";
import { Offer } from "../offer/Offer";
import { SaleOffer } from "../offer/SaleOffer";

export const isAuctionOffer = (offer: Offer): offer is AuctionOffer =>
  offer.type === OfferType.Auction;
export const isSaleOffer = (offer: Offer): offer is SaleOffer =>
  offer.type === OfferType.Sale;
