import { splitSignature } from "ethers/lib/utils";
import { PartialOffer } from "../offer/Offer";
import { AbstractPlatform } from "./AbstractPlatform";
import { LooksRare } from "@refinableco/reservoir-sdk";
import { BytesEmpty } from "@refinableco/reservoir-sdk/dist/utils";
import { Types } from "@refinableco/reservoir-sdk/dist/looks-rare";
import {
  ListApproveStatus,
  ListSignStatus,
  ListStatus,
  LIST_STATUS_STEP,
} from "../nft/interfaces/SaleStatusStep";
import { MutationLooksrareListForSaleArgs, Platform } from "../@types/graphql";
import axios from "axios";
import { gql } from "graphql-request";

export const LOOKSRARE_LIST_FOR_SALE = gql`
  mutation looksrareListForSale($input: LooksrareListForSaleInput!) {
    looksrareListForSale(input: $input)
  }
`;

export class LooksrarePlatform extends AbstractPlatform {
  buy(offer: PartialOffer, contractAddress: string, tokenId: string) {
    const { v, r, s } = splitSignature(offer.orderParams.signature);

    const exchange = new LooksRare.Exchange(1);
    const order = new LooksRare.Order(1, {
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

  async listForSale(
    orderParams: Types.MakerOrderParams,
    options: {
      onProgress?: <T extends ListStatus>(status: T) => void;
      onError?: (
        {
          step,
          platform,
        }: { step: LIST_STATUS_STEP; platform: Platform.Looksrare },
        error
      ) => void;
    }
  ) {
    // approve
    options.onProgress<ListApproveStatus>({
      platform: Platform.Looksrare,
      step: LIST_STATUS_STEP.APPROVE,
      data: {
        addressToApprove: "0x00000000000000000",
      },
    });

    // sign
    const nonce = await this.getNonce(orderParams.signer);

    const order = new LooksRare.Order(1, {
      // looksrare params
      ...orderParams,
      nonce,

      // reservoir specific params
      kind: "single-token",
    });
    options.onProgress<ListSignStatus>({
      platform: Platform.Looksrare,
      step: LIST_STATUS_STEP.SIGN,
      data: {
        hash: order.getSignatureData().value,
        what: "Looksrare order",
      },
    });
    const signature = await this.refinable.account.sign(
      order.getSignatureData()
    );

    // create
    const response = await this.refinable.graphqlClient.request<
      string,
      MutationLooksrareListForSaleArgs
    >(LOOKSRARE_LIST_FOR_SALE, {
      input: { ...order.params, signature },
    });

    return order;
  }

  private async getNonce(makerAddress: string) {
    // TODO: We should only use LooksRare's nonce when cross-posting to their orderbook
    const nonce = await axios
      .get(
        `https://api.looksrare.org/api/v1/orders/nonce?address=${makerAddress}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(({ data }: { data: { data: string } }) => data.data);
    return nonce;
  }
}
