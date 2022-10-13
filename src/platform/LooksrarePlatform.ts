import { parseEther, splitSignature } from "ethers/lib/utils";
import { PartialOffer } from "../offer/Offer";
import { AbstractPlatform } from "./AbstractPlatform";
import { Common, LooksRare, Router } from "@refinableco/reservoir-sdk";
import { Types as LookrareTypes } from "@refinableco/reservoir-sdk/dist/looks-rare";
import { BytesEmpty } from "@refinableco/reservoir-sdk/dist/utils";
import { Types } from "@refinableco/reservoir-sdk/dist/looks-rare";
import {
  ListApproveStatus,
  ListCreateStatus,
  ListSignStatus,
  ListStatus,
  LIST_STATUS_STEP,
} from "../nft/interfaces/SaleStatusStep";
import {
  MutationLooksrareListForSaleArgs,
  Platform,
  Price,
} from "../@types/graphql";
import axios from "axios";
import { gql } from "graphql-request";
import { AbstractEvmNFT } from "../nft/AbstractEvmNFT";
import { StrategyStandardSaleForFixedPrice } from "@refinableco/reservoir-sdk/dist/looks-rare/addresses";
import { ethers } from "ethers";

export const LOOKSRARE_LIST_FOR_SALE = gql`
  mutation looksrareListForSale($input: LooksrareListForSaleInput!) {
    looksrareListForSale(input: $input)
  }
`;

export class LooksrarePlatform extends AbstractPlatform {
  getApprovalAddress(chainId: number): string {
    return LooksRare.Addresses.Exchange[chainId];
  }
  async buy(offer: PartialOffer, contractAddress: string, tokenId: string) {
    const { v, r, s } = splitSignature(offer.orderParams.signature);

    const builder = new LooksRare.Builders.SingleToken(this.refinable.chainId);

    const builtOrder = builder.build({
      ...offer.orderParams,
      collection: contractAddress,
      tokenId: tokenId,
      v,
      r,
      s,
      kind: "single-token",
      params: BytesEmpty,
    });

    // Router supports only ETH transactions
    if (offer.orderParams?.currency === ethers.constants.AddressZero) {
      const router = new Router.Router(1, this.refinable.evm.provider);

      return await router.fillListingsTx(
        [
          {
            kind: "looks-rare",
            contractKind: "erc721",
            contract: contractAddress,
            tokenId,
            order: builtOrder,
            currency: offer.orderParams.currency,
          },
        ],
        offer.orderParams.signer,
        {
          referrer: "refinable.com",
        }
      );
    } else {
      const exchange = new LooksRare.Exchange(1);

      const order = new LooksRare.Order(1, builtOrder.params);

      return exchange.fillOrderTx(this.refinable.accountAddress, order, {
        isOrderAsk: false,
        taker: this.refinable.accountAddress,
        price: offer.orderParams.price,
        tokenId: tokenId,
        minPercentageToAsk: offer.orderParams.minPercentageToAsk,
        params: BytesEmpty,
      });
    }
  }

  /**
   * 1: stands for chain id (Ethereum)
   */

  // -- LOOKSRARE
  // EX.
  // https://docs.looksrare.org/developers/maker-orders#breakdown-of-parameters
  // {
  //   "signature": "0xca048086170d030e223f36f21d329636dc163775ee4130c3f4d62cad8748bd5250cd0aacec582c73d0c53b555ae7661065ed9e16ff4fbfd5bb6e53688e4c807b1c",
  //   "tokenId": null,
  //   "collection": "0xA8Bf4A0993108454aBB4EBb4f5E3400AbB94282D",
  //   "strategy": "0x86F909F70813CdB1Bc733f4D97Dc6b03B8e7E8F3",
  //   "currency": "0xc778417E063141139Fce010982780140Aa0cD5Ab",
  //   "signer": "0x72c0e50be0f76863F708619784Ea4ff48D8587bE",
  //   "isOrderAsk": true,
  //   "nonce": "20",
  //   "amount": "1",
  //   "price": "10201020023",
  //   "startTime": "1645470906",
  //   "endTime": "1645471906",
  //   "minPercentageToAsk": 8500,
  //   "params": ""
  // }

  async listForSale(
    nft: AbstractEvmNFT,
    price: Price,
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
    const now = Math.floor(Date.now() / 1000);

    const orderParams: Types.MakerOrderParams = {
      tokenId: nft.getItem().tokenId,
      collection: nft.getItem().contractAddress,
      strategy: StrategyStandardSaleForFixedPrice[1],
      currency: Common.Addresses.Weth[1],
      signer: this.refinable.accountAddress,
      isOrderAsk: true, // side === "sell"
      amount: "1",
      price: parseEther(price.amount.toString()).toString(),
      startTime: now,
      endTime: now + 86400 * 14, // 2-w validity
      params: BytesEmpty,
      minPercentageToAsk: 8500,
      nonce: "", // filled later
    };

    // approve
    options.onProgress<ListApproveStatus>({
      platform: Platform.Looksrare,
      step: LIST_STATUS_STEP.APPROVE,
      data: {
        addressToApprove: LooksRare.Addresses.TransferManagerErc721[1],
      },
    });
    // Approve the transfer manager
    await nft.approveIfNeeded(LooksRare.Addresses.TransferManagerErc721[1]);

    // sign
    const nonce = await this.getNonce(orderParams.signer);

    // -- LOOKSRARE
    // EX.
    // https://docs.looksrare.org/developers/maker-orders#breakdown-of-parameters
    // {
    //   "signature": "0xca048086170d030e223f36f21d329636dc163775ee4130c3f4d62cad8748bd5250cd0aacec582c73d0c53b555ae7661065ed9e16ff4fbfd5bb6e53688e4c807b1c",
    //   "tokenId": null,
    //   "collection": "0xA8Bf4A0993108454aBB4EBb4f5E3400AbB94282D",
    //   "strategy": "0x86F909F70813CdB1Bc733f4D97Dc6b03B8e7E8F3",
    //   "currency": "0xc778417E063141139Fce010982780140Aa0cD5Ab",
    //   "signer": "0x72c0e50be0f76863F708619784Ea4ff48D8587bE",
    //   "isOrderAsk": true,
    //   "nonce": "20",
    //   "amount": "1",
    //   "price": "10201020023",
    //   "startTime": "1645470906",
    //   "endTime": "1645471906",
    //   "minPercentageToAsk": 8500,
    //   "params": ""
    // }

    const order = new LooksRare.Order(1, {
      // looksrare params
      ...orderParams,
      nonce,

      // reservoir specific params
      kind: "single-token",
    } as LookrareTypes.MakerOrderParams);
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

    const { r, s, v, kind, ...strippedOrderParams } = order.params;

    // create
    const input = { ...strippedOrderParams, signature };
    options.onProgress<ListCreateStatus>({
      platform: Platform.Looksrare,
      step: LIST_STATUS_STEP.CREATE,
    });
    const response = await this.refinable.graphqlClient.request<
      string,
      MutationLooksrareListForSaleArgs
    >(LOOKSRARE_LIST_FOR_SALE, {
      input,
    });

    return response;
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
