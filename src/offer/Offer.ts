import { OfferFragment } from "../@types/graphql";
import { AbstractNFT } from "../nft/AbstractNFT";
import { WhitelistVoucherParams } from "../nft/interfaces/Voucher";
import { Refinable } from "../refinable/Refinable";
import { getUnixEpochTimeStampFromDateOr0 } from "../utils/time";

export interface PartialOffer
  extends Pick<
    OfferFragment,
    | "id"
    | "type"
    | "signature"
    | "contractAddress"
    | "price"
    | "user"
    | "totalSupply"
    | "auction"
    | "blockchainId"
    | "startTime"
    | "endTime"
    | "whitelistStage"
    | "whitelistVoucher"
    | "launchpadDetails"
    | "marketConfig"
    | "supply"
    | "chainId"
  > {}

export class BasicOffer {
  constructor(
    protected readonly refinable: Refinable,
    protected _offer: PartialOffer
  ) {}

  get id() {
    return this._offer.id;
  }

  get type() {
    return this._offer.type;
  }

  get chainId() {
    return this._offer.chainId;
  }

  get price() {
    const amount =
      this.currentStage?.price ??
      this._offer.price.amount;

    return {
      currency: this._offer.price.currency,
      amount,
    };
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

  get currentStage() {
    return this._offer.launchpadDetails?.currentStage;
  }

  protected get whitelistVoucher(): WhitelistVoucherParams | null {
    if (!this._offer.whitelistVoucher) return null;

    delete (this._offer.whitelistVoucher as any).__typename;

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
    protected readonly refinable: Refinable,
    protected _offer: PartialOffer,
    protected readonly nft?: AbstractNFT
  ) {
    super(refinable, _offer);
  }
}
