import { IRoyalty, RoyaltiesInput, RoyaltyStrategy } from "./Royalty";

export class StandardRoyaltyStrategy implements IRoyalty {
  public royaltyStrategy: RoyaltyStrategy =
    RoyaltyStrategy.StandardRoyaltyStrategy;
  public shares?: RoyaltiesInput[];
  public royaltyBps: number = 0;

  constructor(shares: RoyaltiesInput[] = []) {
    this.shares = shares;
  }

  serialize() {
    return {
      royaltyStrategy: 0,
      shares: this.shares.map((share) => [
        share.recipient,
        share.value,
      ]),
      royaltyBps: 0,
    };
  }
}
