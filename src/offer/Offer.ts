import { OfferFragment } from "../@types/graphql";
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
    | "startTime"
    | "endTime"
    | "whitelistStage"
    | "whitelistVoucher"
    | "marketConfig"
    | "supply"
  > {}

export class Offer {
  constructor(
    protected readonly refinable: RefinableBaseClient,
    protected _offer: PartialOffer,
    protected readonly nft: AbstractNFT
  ) {}

  get id() {
    return this._offer.id;
  }

  get type() {
    return this._offer.type;
  }

  get price() {
    return this._offer.price;
  }

  get supply() {
    return this._offer.supply;
  }

  get buyServiceFeeBps() {
    return this._offer.marketConfig.buyServiceFeeBps;
  }

  get auction() {
    return this._offer.auction;
  }

  get sellerAddress() {
    return this._offer.user.ethAddress;
  }

  get totalSupply() {
    return this._offer.totalSupply;
  }

  get whitelistStage() {
    return this._offer.whitelistStage;
  }

  protected subtractOfferSupply(amount: number) {
    return (this._offer.supply -= amount);
  }
}
