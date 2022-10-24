import { Platform, Price } from "../@types/graphql";
import { AbstractEvmNFT } from "../nft/AbstractEvmNFT";
import {
  CancelSaleStatus,
  CANCEL_SALE_STATUS_STEP,
} from "../nft/interfaces/CancelSaleStatusStep";
import { ListStatus, LIST_STATUS_STEP } from "../nft/interfaces/SaleStatusStep";
import { PartialOffer } from "../offer/Offer";
import { Refinable } from "../refinable/Refinable";
import EvmTransaction from "../transaction/EvmTransaction";

export abstract class AbstractPlatform {
  constructor(protected readonly refinable: Refinable) {}

  abstract getApprovalAddress(chainId: number): Promise<string> | string;
  abstract buy(offer: PartialOffer, contractAddress: string, tokenId: string);
  abstract cancelSale(
    offer: PartialOffer,
    options: {
      onProgress?: <T extends CancelSaleStatus>(status: T) => void;
      onError?: (
        {
          step,
          platform,
        }: { step: CANCEL_SALE_STATUS_STEP; platform: Platform },
        error
      ) => void;
    }
  ): Promise<EvmTransaction>;
  abstract listForSale(
    nft: AbstractEvmNFT,
    price: Price,
    options: {
      onProgress?: <T extends ListStatus>(status: T) => void;
      onError?: (
        { step, platform }: { step: LIST_STATUS_STEP; platform: Platform },
        error
      ) => void;
    }
  );
}
