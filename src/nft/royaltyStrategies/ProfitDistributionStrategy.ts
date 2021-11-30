import {
  convertToBps,
  IRoyalty,
  RoyaltiesInput,
  RoyaltyStrategy,
} from "./Royalty";

export class ProfitDistributionStrategy implements IRoyalty {
  public royaltyStrategy: RoyaltyStrategy =
    RoyaltyStrategy.ProfitDistributionStrategy;
  public shares?: RoyaltiesInput[];
  public royaltyBps?: number;

  constructor(
    shares: RoyaltiesInput[] = [],
    royaltyPercentage: number
  ) {
    this.shares = shares;
    this.royaltyBps = convertToBps(royaltyPercentage);
  }

  serialize() {
    return {
      royaltyStrategy: 1,
      shares: this.shares.map((share) => [share.recipient, share.value]),
      royaltyBps: this.royaltyBps,
    };
  }
}
