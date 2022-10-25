import { Platform } from "../@types/graphql";
import { AbstractEvmNFT } from "../nft/AbstractEvmNFT";
import {
  CancelSaleStatus,
  CANCEL_SALE_STATUS_STEP,
} from "../nft/interfaces/CancelSaleStatusStep";
import { IOffer } from "../nft/interfaces/Offer";
import { IPrice } from "../nft/interfaces/Price";
import { ListStatus, LIST_STATUS_STEP } from "../nft/interfaces/SaleStatusStep";
import { Refinable } from "../refinable/Refinable";
import EvmTransaction from "../transaction/EvmTransaction";

export abstract class AbstractPlatform {
  constructor(protected readonly refinable: Refinable) {}

  abstract getApprovalAddress(chainId: number): Promise<string> | string;
  abstract cancelSale(
    offer: IOffer,
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
  abstract buy(
    MakerOrderParams: IOffer["orderParams"],
    contractAddress: string,
    tokenId: string
  );
  abstract listForSale(
    nft: AbstractEvmNFT,
    price: IPrice,
    options: {
      onProgress?: <T extends ListStatus>(status: T) => void;
      onError?: (
        { step, platform }: { step: LIST_STATUS_STEP; platform: Platform },
        error
      ) => void;
    }
  );
}
