import { IRoyalty, Royalties, RoyaltyStrategy } from "./Royalty";

export class StandardRoyaltyStrategy implements IRoyalty {
  constructor(private readonly royaltyShares: Royalties[]) {}

  serialize() {
    return {
      royaltyStrategy: RoyaltyStrategy.StandardRoyaltyStrategy,
      shares: this.royaltyShares,
      royaltyBps: 0,
    };
  }
}
