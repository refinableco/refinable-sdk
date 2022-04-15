import { OfferType } from "../@types/graphql";
import { AbstractNFT } from "../nft/AbstractNFT";
import { RefinableBaseClient } from "../refinable/RefinableBaseClient";
import { AuctionOffer } from "./AuctionOffer";
import { Offer, PartialOffer } from "./Offer";
import { SaleOffer } from "./SaleOffer";

export { OfferType };

export const offerClassMap = {
  [OfferType.Auction]: AuctionOffer,
  [OfferType.Sale]: SaleOffer,
};

export type OfferMapType = typeof offerClassMap;
type Tuples<T> = T extends OfferType
  ? [T, InstanceType<OfferMapType[T]>]
  : never;
export type SingleKeys<K> = [K] extends (K extends OfferType ? [K] : never)
  ? K
  : never;
type ClassType<A extends OfferType, F> =
  | Extract<Tuples<OfferType>, [A, any]>[1]
  | F;

export class OfferFactory {
  public static createOffer<O extends Offer>(
    refinable: RefinableBaseClient,
    offer: PartialOffer,
    nft: AbstractNFT
  ): ClassType<O["type"], never> {
    return new offerClassMap[offer.type](refinable, offer, nft);
  }
}
