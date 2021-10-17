import { OfferType } from "../@types/graphql";
import { AbstractNFT } from "../nft/AbstractNFT";
import { Refinable } from "../Refinable";
import { AuctionOffer } from "./AuctionOffer";
import { PartialOffer } from "./Offer";
import { SaleOffer } from "./SaleOffer";

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
  public static createOffer<K extends OfferType>(
    refinable: Refinable,
    offer: PartialOffer & { type: SingleKeys<K> },
    nft: AbstractNFT
  ): ClassType<K, never> {
    return new offerClassMap[offer.type](refinable, offer, nft);
  }
}
