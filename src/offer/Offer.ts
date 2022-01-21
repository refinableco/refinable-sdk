import {
  AuctionFragment,
  OfferFragment,
  OfferType,
  Price,
} from "../@types/graphql";
import { AbstractNFT } from "../nft/AbstractNFT";
import { RefinableBaseClient } from "../refinable/RefinableBaseClient";

export interface PartialOffer
  extends Pick<
    OfferFragment,
    | "id"
    | "type"
    | "signature"
    | "price"
    | "user"
    | "totalSupply"
    | "auction"
    | "blockchainId"
  > {}

export class Offer implements PartialOffer {
  id: string;
  type: OfferType;
  signature?: string;
  blockchainId?: string;
  price: Price;
  totalSupply: number;
  auction?: AuctionFragment;
  user: { id: string; ethAddress?: string };

  constructor(
    protected readonly refinable: RefinableBaseClient,
    offer: PartialOffer,
    protected readonly nft: AbstractNFT
  ) {
    Object.assign(this, offer);
  }
}
