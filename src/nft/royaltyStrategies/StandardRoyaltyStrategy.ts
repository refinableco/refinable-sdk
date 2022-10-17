import { constants } from "ethers";
import { IRoyalty, RoyaltiesInput, RoyaltyStrategy } from "./Royalty";

export class StandardRoyaltyStrategy implements IRoyalty {
  public royaltyStrategy: RoyaltyStrategy =
    RoyaltyStrategy.StandardRoyaltyStrategy;
  public shares?: RoyaltiesInput[];
  public royaltyBps: number = 0;

  constructor(shares: RoyaltiesInput[] = []) {
    this.shares = shares;
  }

  serialize(useEip2981?: boolean) {
    // As per eip-2981, new contracts only accept 1 recipient
    if (useEip2981) {
      let share: RoyaltiesInput = {
        recipient: constants.AddressZero,
        value: 0,
      };

      const validShare = this.shares.find((share) => share.value > 0);

      if (validShare) {
        share = validShare;
      }

      return {
        royaltyStrategy: 0,
        shares: [share.recipient, share.value],
        royaltyBps: 0,
      };
    }

    return {
      royaltyStrategy: 0,
      shares: this.shares.map((share) => [share.recipient, share.value]),
      royaltyBps: 0,
    };
  }
}
