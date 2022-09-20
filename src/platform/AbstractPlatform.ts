import { Types as LookrareTypes } from "@refinableco/reservoir-sdk/dist/looks-rare";
import { Types as X2Y2Types } from "@refinableco/reservoir-sdk/dist/x2y2";
import { Platform } from "../@types/graphql";
import { ListStatus, LIST_STATUS_STEP } from "../nft/interfaces/SaleStatusStep";
import { PartialOffer } from "../offer/Offer";
import { Refinable } from "../refinable/Refinable";

export abstract class AbstractPlatform {
  constructor(protected readonly refinable: Refinable) {}

  abstract buy(offer: PartialOffer, contractAddress: string, tokenId: string);
  abstract listForSale(
    orderParams: LookrareTypes.MakerOrderParams | X2Y2Types.Order,
    options: {
      onProgress?: <T extends ListStatus>(status: T) => void;
      onError?: (
        { step, platform }: { step: LIST_STATUS_STEP; platform: Platform },
        error
      ) => void;
    }
  );
}
