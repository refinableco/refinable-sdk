import { RefinableEvmClient } from "../..";
import { MintOfferFragment } from "../../@types/graphql";
import { MintOffer } from "../../offer/MintOffer";
import { PartialOffer } from "../../offer/Offer";

export class OfferClient {
  constructor(private readonly refinable: RefinableEvmClient) {}

  public async createMintOffer(
    offer?: PartialOffer & MintOfferFragment
  ): Promise<MintOffer> {
    const chainId = await this.refinable.provider.getChainId();
    return new MintOffer(this.refinable, chainId, offer);
  }
}
