import { AbstractPlatform } from "./AbstractPlatform";
import {
  MutationX2y2ListForSaleArgs,
  Platform,
  QueryGetUnsignedTxArgs,
} from "../@types/graphql";
import { Refinable } from "../refinable/Refinable";
import {
  ListApproveStatus,
  ListSignStatus,
  ListStatus,
  LIST_STATUS_STEP,
} from "../nft/interfaces/SaleStatusStep";
import {
  CancelSaleSignStatus,
  CancelSaleStatus,
  CANCEL_SALE_STATUS_STEP,
} from "../nft/interfaces/CancelSaleStatusStep";
import { Common, X2Y2 } from "@refinableco/reservoir-sdk";
import { AbstractEvmNFT } from "../nft/AbstractEvmNFT";
import { BigNumberish } from "ethers";
import { BaseBuildParams } from "@refinableco/reservoir-sdk/dist/x2y2/builders/base";
import ExchangeAbi from "@refinableco/reservoir-sdk/dist/x2y2/abis/Exchange.json";
import {
  defaultAbiCoder,
  keccak256,
  parseEther,
  splitSignature,
} from "ethers/lib/utils";
import { gql } from "graphql-request";
import { GET_UNSIGNED_PURCHASE_TX } from "../graphql/sale";
import EvmTransaction from "../transaction/EvmTransaction";
import { ContractWrapper } from "../refinable/contract/ContractWrapper";
import { IOffer } from "../nft/interfaces/Offer";
import { IPrice } from "../nft/interfaces/Price";

export const X2Y2_LIST_FOR_SALE = gql`
  mutation x2y2ListForSale($input: X2Y2ListForSaleInput!) {
    x2y2ListForSale(input: $input)
  }
`;

export const X2Y2_CANCEL_SALE = gql`
  mutation x2y2CancelSale($input: X2Y2ListForSaleInput!) {
    x2y2CancelSale(input: $input)
  }
`;

interface BuildParams extends BaseBuildParams {
  tokenId: BigNumberish;
}

export class X2Y2Platform extends AbstractPlatform {
  private exchangeContract: ContractWrapper;

  constructor(refinable: Refinable) {
    super(refinable);

    this.exchangeContract = new ContractWrapper(
      {
        address: X2Y2.Addresses.Exchange[refinable.chainId],
        chainId: refinable.chainId,
        abi: JSON.stringify(ExchangeAbi),
      },
      refinable.provider,
      {}
    );
  }

  getApprovalAddress(chainId: number): string {
    return X2Y2.Addresses.Exchange[chainId];
  }

  async buy(
    orderParams: IOffer["orderParams"],
    contractAddress: string,
    tokenId: string
  ) {
    const input = {
      id: orderParams.id,
      type: orderParams.type,
      currency: orderParams.currency,
      price: orderParams.price,
      maker: orderParams.maker,
      taker: orderParams.taker ?? this.refinable.accountAddress,
      deadline: orderParams.end_at,
      itemHash: orderParams.item_hash,
      nft: {
        token: contractAddress,
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

  async cancelSale(
    offer: IOffer["orderParams"],
    options: {
      onProgress?: <T extends CancelSaleStatus>(status: T) => void;
      onError?: (
        {
          step,
          platform,
        }: { step: CANCEL_SALE_STATUS_STEP; platform: Platform },
        error: any
      ) => void;
      confirmations?: number;
    }
  ): Promise<EvmTransaction> {
    const signMessage = keccak256("0x");

    options.onProgress<CancelSaleSignStatus>({
      platform: Platform.X2Y2,
      step: CANCEL_SALE_STATUS_STEP.SIGN,
      data: {
        hash: signMessage,
        what: "X2Y2 order",
      },
    });

    const signature = await this.refinable.account.sign(signMessage);

    options.onProgress<CancelSaleStatus>({
      platform: Platform.X2Y2,
      step: CANCEL_SALE_STATUS_STEP.CANCELING,
    });

    const queryResponse = await this.refinable.graphqlClient.request<
      string,
      any
    >(X2Y2_CANCEL_SALE, {
      input: {
        user: this.refinable.accountAddress,
        message: signMessage,
        signature,
        offerId: offer.orderParams?.id,
      },
    });

    const input = defaultAbiCoder.decode(
      [
        "(bytes32[] itemHashes, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
      ],
      queryResponse
    )[0];

    const tx = await this.exchangeContract.sendTransaction("cancel", [
      input.itemHashes,
      input.deadline,
      input.v,
      input.r,
      input.s,
    ]);

    options.onProgress<CancelSaleStatus>({
      platform: Platform.X2Y2,
      step: CANCEL_SALE_STATUS_STEP.DONE,
    });

    return tx;
  }

  async listForSale(
    nft: AbstractEvmNFT,
    price: IPrice,
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
