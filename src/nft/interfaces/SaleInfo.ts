import { WhitelistType } from "./Voucher";

export enum SaleVersion {
  V1 = 0,
  V2 = 1,
}

export interface SaleInfo {
  // latest one, right now we're at V2
  saleVersion: SaleVersion;
  buying: number;
  selling: number;

  // when does the public sale start
  startTime: number;

  // when does the sale end? (optional, default = 0)
  endTime: number;
  payToken: string;
  seller: string;
  royaltyToken: string;
  signature: string;
}

export interface LaunchpadStage {
  // PRIVATE, VIP?
  // PUBLIC is not really used, this is the startTime on SaleInfo
  stage: WhitelistType;

  // When does this stage start?
  startTime: Date;

  // array of user addresses that should be whitelisted
  whitelist: string[];
}
export interface LaunchpadDetails {
  // array of stages, ideally cronologically, but we sort on time just to make sure
  stages: LaunchpadStage[];
}
