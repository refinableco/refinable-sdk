import { Store as IStore } from "../@types/graphql";
import { BasicOffer } from "../offer/Offer";
import { Refinable } from "../refinable/Refinable";

export interface PartialStore extends Pick<IStore, "id"> {}

export class Store implements PartialStore {
  id: string;

  constructor(protected readonly refinable: Refinable, store: PartialStore) {
    Object.assign(this, store);
  }

  async getOffer<O extends BasicOffer = BasicOffer>(
    offerId: string
  ): Promise<O> {
    return this.refinable.offer.getOffer<O>(offerId, this.id);
  }
}
