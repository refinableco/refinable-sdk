import { PartialOffer } from "../../offer/Offer";

export enum WhitelistType {
  PUBLIC = 0,
  VIP = 1,
  PRIVATE = 2,
}

export type WhitelistVoucherParams = Omit<
  PartialOffer["whitelistVoucher"],
  "startTime"
> & {
  startTime: number;
};
