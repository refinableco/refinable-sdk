import { AbstractPlatform } from "./AbstractPlatform";
import {
  MutationX2y2ListForSaleArgs,
  Platform,
  Price,
  QueryGetUnsignedTxArgs,
} from "../@types/graphql";
import { Refinable } from "../refinable/Refinable";
import { PartialOffer } from "../offer/Offer";
import {
  ListApproveStatus,
  ListSignStatus,
  ListStatus,
  LIST_STATUS_STEP,
} from "../nft/interfaces/SaleStatusStep";
import { Common, X2Y2 } from "@refinableco/reservoir-sdk";
import { AbstractEvmNFT } from "../nft/AbstractEvmNFT";
import { BigNumberish } from "ethers";
import { BaseBuildParams } from "@refinableco/reservoir-sdk/dist/x2y2/builders/base";
import { parseEther, splitSignature } from "ethers/lib/utils";
import { gql } from "graphql-request";
import { GET_UNSIGNED_PURCHASE_TX } from "../graphql/sale";

export const X2Y2_LIST_FOR_SALE = gql`
  mutation x2y2ListForSale($input: X2Y2ListForSaleInput!) {
    x2y2ListForSale(input: $input)
  }
`;

interface BuildParams extends BaseBuildParams {
  tokenId: BigNumberish;
}

export class X2Y2Platform extends AbstractPlatform {
  constructor(refinable: Refinable) {
    super(refinable);
  }

  getApprovalAddress(chainId: number): string {
    return X2Y2.Addresses.Exchange[chainId];
  }

  async buy(offer: PartialOffer, tokenId: string) {
    const input = {
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
    const queryResponse = await this.refinable.graphqlClient.request<
      string,
      QueryGetUnsignedTxArgs
    >(GET_UNSIGNED_PURCHASE_TX, {
      data: {
        platform: Platform.X2Y2,
        x2y2Data: input,
      },
    });
    return queryResponse;
  }

  async listForSale(
    nft: AbstractEvmNFT,
    price: Price,
    options: {
      onProgress?: <T extends ListStatus>(status: T) => void;
      onError?: (
        { step, platform }: { step: LIST_STATUS_STEP; platform: Platform.X2Y2 },
        error
      ) => void;
    }
  ) {
    const now = Math.floor(Date.now() / 1000);

    const orderParams: X2Y2.Types.Order = {
      kind: "single-token",
      id: 0,
      type: "fixed-price",
      currency: Common.Addresses.Eth[1],
      price: parseEther(price.amount.toString()).toString(),
      maker: this.refinable.accountAddress,
      taker: "",
      deadline: now + 86400 * 14, // 2-w validity
      itemHash: "0x",
      nft: {
        token: nft.getItem().contractAddress,
        tokenId: nft.getItem().tokenId,
      },
    };

    options.onProgress<ListApproveStatus>({
      platform: Platform.X2Y2,
      step: LIST_STATUS_STEP.APPROVE,
      data: {
        addressToApprove: X2Y2.Addresses.Erc721Delegate[1],
      },
    });

    await nft.approveIfNeeded(X2Y2.Addresses.Erc721Delegate[1]);

    options.onProgress<ListSignStatus>({
      platform: Platform.X2Y2,
      step: LIST_STATUS_STEP.SIGN,
      data: {
        hash: "",
        what: "X2Y2 order",
      },
    });

    const buildParams: BuildParams = {
      tokenId: orderParams.nft.tokenId,
      user: orderParams.maker,
      network: 1,
      side: "sell",
      deadline: orderParams.deadline,
      currency: orderParams.currency,
      price: orderParams.price,
      contract: orderParams.nft.token,
    };

    const localOrder = X2Y2.Builders.SingleTokenBuilder.buildOrder(buildParams);

    const exchange = new X2Y2.Exchange(1, process.env.X2Y2_API_KEY);

    const { message } = exchange.getOrderSignatureData(localOrder);
    const { r, s, v } = splitSignature(
      await this.refinable.account.sign(message)
    );

    const queryResponse = await this.refinable.graphqlClient.request<
      string,
      MutationX2y2ListForSaleArgs
    >(X2Y2_LIST_FOR_SALE, {
      input: {
        ...localOrder,
        r,
        s,
        v,
      },
    });

    return queryResponse;
  }
}
