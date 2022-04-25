export enum WhitelistType {
  PUBLIC = 0,
  VIP = 1,
  PRIVATE = 2,
}

export interface WhitelistVoucherParams {
  whitelistType: WhitelistType;
  limit: number;
  signature: string;
  startTime: number;
}
