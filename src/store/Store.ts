import { Store as IStore } from "../@types/graphql";
import { BasicOffer } from "../offer/Offer";
import { RefinableBaseClient } from "../refinable/RefinableBaseClient";

export interface PartialStore extends Pick<IStore, "id"> {}

export class Store implements PartialStore {
  id: string;

  constructor(
    protected readonly refinable: RefinableBaseClient,
    store: PartialStore
  ) {
    Object.assign(this, store);
  }

  async getOffer<O extends BasicOffer = BasicOffer>(
    offerId: string
  ): Promise<O> {
    return this.refinable.getOffer<O>(offerId, this.id);
  }
}
