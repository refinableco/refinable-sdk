export type RoyaltiesInput = {
  value: number;
  recipient: string;
};

export enum RoyaltyStrategy {
  StandardRoyaltyStrategy = "STANDARD_ROYALTY_STRATEGY",
  ProfitDistributionStrategy = "PROFIT_DISTRIBUTION_STRATEGY",
}

export type RoyaltySettingsInput = {
  shares?: RoyaltiesInput[];
  royaltyStrategy: RoyaltyStrategy;
  royaltyBps?: number;
};

export type SerializedRoyaltySettings = {
  shares?: (string | number)[][] | (string | number)[];
  royaltyStrategy: number;
  royaltyBps?: number;
};

export interface Royalties {
  value: number;
  recipient: string;
}

/**
 * Convert to BPS https://www.investopedia.com/ask/answers/what-basis-point-bps/
 * @param value
 * @returns
 */
export const convertToBps = (value: number): number => {
  return Math.trunc(value * 100);
};

export interface IRoyalty {
  shares?: RoyaltiesInput[];
  royaltyStrategy: RoyaltyStrategy;
  royaltyBps?: number;

  serialize: (useEip2981?: boolean) => SerializedRoyaltySettings;
}
