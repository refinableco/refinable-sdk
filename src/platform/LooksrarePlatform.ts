import { splitSignature } from "ethers/lib/utils";
import { PartialOffer } from "../offer/Offer";
import { AbstractPlatform } from "./AbstractPlatform";
import * as reservoirSdk from "@refinableco/reservoir-sdk";
import { BytesEmpty } from "@refinableco/reservoir-sdk/dist/utils";

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
    const unsignedTx = exchange.fillOrderTx(
      this.refinable.accountAddress,
      order,
      {
        isOrderAsk: false,
        taker: this.refinable.accountAddress,
        price: offer.orderParams.price,
        tokenId: tokenId,
        minPercentageToAsk: offer.orderParams.minPercentageToAsk,
        params: BytesEmpty,
      }
    );

    return unsignedTx;
  }
}
