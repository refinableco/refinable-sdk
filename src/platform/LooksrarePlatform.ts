import { splitSignature } from "ethers/lib/utils";
import { PartialOffer } from "../offer/Offer";
import { AbstractPlatform } from "./AbstractPlatform";
import * as reservoirSdk from "@reservoir0x/sdk";
import { BytesEmpty } from "@reservoir0x/sdk/dist/utils";

export class LooksrarePlatform extends AbstractPlatform {
  buy(offer: PartialOffer, contractAddress: string, tokenId: string) {
    const { v, r, s } = splitSignature(offer.orderParams.signature);

    const exchange = new reservoirSdk.LooksRare.Exchange(1);
    const order = new reservoirSdk.LooksRare.Order(1, {
      ...offer.orderParams,
      collection: contractAddress,
      tokenId: tokenId,
      v,
      r,
      s,
      kind: "single-token",
      params: BytesEmpty,
    });

    return exchange.fillOrder(this.refinable.provider, order, {
      isOrderAsk: false,
      taker: this.refinable.accountAddress,
      price: offer.orderParams.price,
      tokenId: tokenId,
      minPercentageToAsk: offer.orderParams.minPercentageToAsk,
      params: BytesEmpty,
    });
  }
}
