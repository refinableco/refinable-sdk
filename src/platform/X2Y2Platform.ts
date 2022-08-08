import { AbstractPlatform } from "./AbstractPlatform";
import { GET_UNSGINED_TX } from "../graphql/x2y2";
import { GetUnsignedTxInput} from "../@types/graphql";
import { Refinable } from "../refinable/Refinable";
import { PartialOffer } from "../offer/Offer";

export class X2Y2Platform extends AbstractPlatform {
  constructor(refinable: Refinable) {
    super(refinable);
  }  
  
  public async buy(offer: PartialOffer, tokenId: string) {
    const input: GetUnsignedTxInput = {
      id: offer.orderParams.id,
      type: offer.orderParams.type,
      currency: offer.orderParams.currency,
      price: offer.orderParams.price,
      maker: offer.orderParams.maker,
      taker: offer.orderParams.taker ?? this.refinable.accountAddress,
      deadline: offer.orderParams.end_at,
      itemHash: offer.orderParams.item_hash,
      nft: {
          token: offer.orderParams.token.contract,
          tokenId
      },
    };
    const queryResponse = await this.refinable.graphqlClient.request(GET_UNSGINED_TX, {
        data: input
    });
    return queryResponse.x2y2.getUnsignedTx;
  }
}
