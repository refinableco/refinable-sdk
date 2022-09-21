import { AbstractPlatform } from "./AbstractPlatform";
import { GET_UNSGINED_TX as GET_UNSIGNED_TX } from "../graphql/x2y2";
import { GetUnsignedTxInput, Platform } from "../@types/graphql";
import { Refinable } from "../refinable/Refinable";
import { PartialOffer } from "../offer/Offer";
import { ListStatus, LIST_STATUS_STEP } from "../nft/interfaces/SaleStatusStep";
import { Types } from "@refinableco/reservoir-sdk/dist/x2y2";
import { X2Y2 } from "@refinableco/reservoir-sdk";

export class X2Y2Platform extends AbstractPlatform {
  constructor(refinable: Refinable) {
    super(refinable);
  }


  getApprovalAddress(chainId: number): string {
    return X2Y2.Addresses.Exchange[chainId];
  }

  async buy(offer: PartialOffer, tokenId: string) {
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
        tokenId,
      },
    };
    const queryResponse = await this.refinable.graphqlClient.request(
      GET_UNSIGNED_TX,
      {
        data: input,
      }
    );
    return queryResponse.x2y2.getUnsignedTx;
  }

  async listForSale(
    orderParams: Types.Order,
    options: {
      onProgress?: <T extends ListStatus>(status: T) => void;
      onError?: (
        { step, platform }: { step: LIST_STATUS_STEP; platform: Platform.X2Y2 },
        error
      ) => void;
    }
  ) {
    throw new Error("Method not implemented.");
  }
}
