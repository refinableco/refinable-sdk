export enum WhitelistType {
  PUBLIC,
  VIP,
  PRIVATE,
}

export interface WhitelistVoucherParams {
  whitelistType: WhitelistType;
  limit: number;
  signature: string;
  startTime: number;
}
