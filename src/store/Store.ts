import { Store as IStore } from "../@types/graphql";
import { Offer } from "../offer/Offer";
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

  async getOffer<O extends Offer = Offer>(offerId: string): Promise<O> {
    return this.refinable.getOffer(offerId, this.id);
  }
}
