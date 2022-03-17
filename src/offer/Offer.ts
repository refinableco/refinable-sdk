import {
  AuctionFragment,
  OfferFragment,
  OfferType,
  Price,
  WhitelistVoucher,
} from "../@types/graphql";
import { AbstractNFT } from "../nft/AbstractNFT";
import { RefinableBaseClient } from "../refinable/RefinableBaseClient";

export interface PartialOfferInput
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
    | "startTime"
    | "endTime"
    | "whitelistStage"
    | "whitelistVoucher"
  > {}

export interface PartialOffer
  extends Pick<
    PartialOfferInput,
    | "id"
    | "type"
    | "signature"
    | "price"
    | "user"
    | "totalSupply"
    | "auction"
    | "blockchainId"
    | "startTime"
    | "endTime"
    | "whitelistStage"
    | "whitelistVoucher"
  > {}

export class Offer implements PartialOffer {
  id: string;
  type: OfferType;
  signature?: string;
  blockchainId?: string;
  price: Price;
  totalSupply: number;
  auction?: AuctionFragment;
  startTime?: Date | null | undefined;
  endTime?: Date | null | undefined;
  whitelistVoucher?: WhitelistVoucher;
  whitelistStage: OfferFragment["whitelistStage"];
  user: { id: string; ethAddress?: string };

  constructor(
    protected readonly refinable: RefinableBaseClient,
    offer: PartialOfferInput,
    protected readonly nft: AbstractNFT
  ) {
    Object.assign(this, offer);
  }
}
