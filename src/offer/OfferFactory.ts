import { OfferType } from "../@types/graphql";
import { AbstractNFT } from "../nft/AbstractNFT";
import { IOffer } from "../nft/interfaces/Offer";
import { Refinable } from "../refinable/Refinable";
import { AuctionOffer } from "./AuctionOffer";
import { BasicOffer } from "./Offer";
import { SaleOffer } from "./SaleOffer";

export { OfferType };

// any is needed because we won't be using this for MintOffers, the parameters are different
// we will be deprecating the OfferFactory soon
export const offerClassMap: any = {
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
  public static createOffer<O extends BasicOffer>(
    refinable: Refinable,
    offer: IOffer,
    nft: AbstractNFT
  ): ClassType<O["type"], never> {
    return new offerClassMap[offer.type](refinable, offer, nft);
  }
}
