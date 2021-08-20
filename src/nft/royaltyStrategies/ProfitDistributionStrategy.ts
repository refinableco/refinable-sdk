import {
  convertToBps,
  IRoyalty,
  RoyaltiesInput,
  RoyaltyStrategy,
} from "./Royalty";

export class ProfitDistributionStrategy implements IRoyalty {
  constructor(
    private readonly profitDistributionShares: RoyaltiesInput[],
    private readonly royaltyPercentage: number
  ) {}

  serialize() {
    return {
      royaltyStrategy: RoyaltyStrategy.ProfitDistributionStrategy,
      shares: this.profitDistributionShares,
      royaltyBps: convertToBps(this.royaltyPercentage),
    };
  }
}
