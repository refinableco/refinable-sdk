import { AbstractPlatform } from "./AbstractPlatform";
import { GET_UNSIGNED_TX, POST_ORDER } from "../graphql/x2y2";
import { GetUnsignedTxInput, Platform, X2Y2PostOrderArgs, X2y2PostOrderQuery } from "../@types/graphql";
import { Refinable } from "../refinable/Refinable";
import { PartialOffer } from "../offer/Offer";
import { ListApproveStatus, ListSignStatus, ListStatus, LIST_STATUS_STEP } from "../nft/interfaces/SaleStatusStep";
import { X2Y2 } from "@refinableco/reservoir-sdk";
import { AbstractEvmNFT } from "../nft/AbstractEvmNFT";
import { BigNumberish } from 'ethers'
import { BaseBuildParams } from "@refinableco/reservoir-sdk/dist/x2y2/builders/base";

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
    nft: AbstractEvmNFT,
    orderParams: X2Y2.Types.Order,
    options: {
      onProgress?: <T extends ListStatus>(status: T) => void;
      onError?: (
        { step, platform }: { step: LIST_STATUS_STEP; platform: Platform.X2Y2 },
        error
      ) => void;
    }
  ) {

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
        hash: '',
        what: 'X2Y2 order',
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
    }

    const localOrder = X2Y2.Builders.SingleTokenBuilder.buildOrder(buildParams);

    const exchange = new X2Y2.Exchange(1, process.env.X2Y2_API_KEY);
    await exchange.signOrder(this.refinable.provider, localOrder);

    const queryResponse = await this.refinable.graphqlClient.request<X2y2PostOrderQuery, X2Y2PostOrderArgs>(
      POST_ORDER,
      {
        data: {
          ...localOrder,
        },
      }
    );

    return queryResponse.x2y2.postOrder;
  }
}
