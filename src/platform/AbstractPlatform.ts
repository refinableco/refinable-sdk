import { PartialOffer } from "../offer/Offer";

export abstract class AbstractPlatform {
  constructor(protected readonly refinable) {}

  abstract buy(offer: PartialOffer, contractAddress: string, tokenId: string);
  abstract listForSale(
    offer: PartialOffer,
    contractAddress: string,
    tokenId: string
  );
}
