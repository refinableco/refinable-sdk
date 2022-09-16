import { PartialOffer } from "../offer/Offer";
import { Refinable } from "../refinable/Refinable";

export abstract class AbstractPlatform {
  constructor(protected readonly refinable: Refinable) {}

  abstract buy(offer: PartialOffer, contractAddress: string, tokenId: string);
  abstract listForSale(
    offer: PartialOffer,
    contractAddress: string,
    tokenId: string
  );
}
