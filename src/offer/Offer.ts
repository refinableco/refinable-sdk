import { OfferFragment } from "../@types/graphql";
import { AbstractNFT } from "../nft/AbstractNFT";
import {
  WhitelistType,
  WhitelistVoucherParams,
} from "../nft/interfaces/Voucher";
import { RefinableBaseClient } from "../refinable/RefinableBaseClient";
import { getUnixEpochTimeStampFromDateOr0 } from "../utils/time";

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

export class BasicOffer {
  constructor(
    protected readonly refinable: RefinableBaseClient<any>,
    protected _offer: PartialOffer
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

  protected get whitelistVoucher(): WhitelistVoucherParams | null {
    if (!this._offer.whitelistVoucher) return null;

    delete this._offer.whitelistVoucher.__typename;

    return {
      ...this._offer.whitelistVoucher,
      startTime: getUnixEpochTimeStampFromDateOr0(
        this._offer.whitelistVoucher?.startTime
      ),
    };
  }

  protected subtractOfferSupply(amount: number) {
    return (this._offer.supply -= amount);
  }
}

export class Offer extends BasicOffer {
  constructor(
    protected readonly refinable: RefinableBaseClient,
    protected _offer: PartialOffer,
    protected readonly nft?: AbstractNFT
  ) {
    super(refinable, _offer);
  }
}
