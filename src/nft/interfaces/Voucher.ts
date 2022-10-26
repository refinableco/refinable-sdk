import { IOffer } from "./Offer";

export enum WhitelistType {
  PUBLIC = 0,
  VIP = 1,
  PRIVATE = 2,
}

export type WhitelistVoucherParams = Omit<
  IOffer["whitelistVoucher"],
  "startTime"
> & {
  startTime: number;
};
