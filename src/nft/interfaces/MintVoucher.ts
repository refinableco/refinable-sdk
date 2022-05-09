export interface MintVoucher {
  currency: string; // using the zero address means Native
  price: string;
  supply: string; // total Supply that can be purchased,
  payee: string;
  seller: string;
  startTime: number;
  endTime: number;
  recipient: string; // using the zero address means anyone can claim
  data: string;
  signature: string;
  marketConfigData: string;
  marketConfigDataSignature: string;
}
