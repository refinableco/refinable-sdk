import { RefinableEvmClient } from "../..";
import { MintOffer } from "../../offer/MintOffer";

export class OfferClient {
  constructor(private readonly refinable: RefinableEvmClient) {}

  public async createMintOffer(): Promise<MintOffer> {
    const chainId = await this.refinable.provider.getChainId();
    return new MintOffer(this.refinable, chainId);
  }
}
