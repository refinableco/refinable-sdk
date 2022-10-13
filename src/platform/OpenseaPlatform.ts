import { utils, constants } from "ethers/lib/ethers";
import { PartialOffer } from "../offer/Offer";
import { AbstractPlatform } from "./AbstractPlatform";
import { Router, Seaport } from "@refinableco/reservoir-sdk";
import {
  ListApproveStatus,
  ListCreateStatus,
  ListSignStatus,
  ListStatus,
  LIST_STATUS_STEP,
} from "../nft/interfaces/SaleStatusStep";
import {
  MutationOpenseaListForSaleArgs,
  Platform,
  OpenseaItemType,
  Price,
} from "../@types/graphql";
import { gql } from "graphql-request";
import { Refinable } from "../refinable/Refinable";
import { ContractWrapper } from "../refinable/contract/ContractWrapper";
import { AbstractEvmNFT } from "../nft/AbstractEvmNFT";
import { Chain as ValidChains } from "../interfaces/Network";

import ExchangeAbi from "@refinableco/reservoir-sdk/dist/seaport/abis/Exchange.json";
import ConduitControllerAbi from "@refinableco/reservoir-sdk/dist/seaport/abis/ConduitController.json";
import { Chain } from "../refinable/Chain";
import { ItemType } from "@refinableco/reservoir-sdk/dist/seaport/types";

const Addresses = {
  [ValidChains.Ethereum]: {
    Exchange: Seaport.Addresses.Exchange[ValidChains.Ethereum],
    ConduitController:
      Seaport.Addresses.ConduitController[ValidChains.Ethereum],
    ConduitKey: Seaport.Addresses.OpenseaConduitKey[ValidChains.Ethereum],
    Zone: Seaport.Addresses.PausableZone[ValidChains.Ethereum],
    FeeRecipient: "0x0000a26b00c1f0df003000390027140000faa719",
  },
  [ValidChains.EthereumGoerli]: {
    Exchange: Seaport.Addresses.Exchange[ValidChains.Ethereum],
    ConduitController:
      Seaport.Addresses.ConduitController[ValidChains.Ethereum],
    ConduitKey: Seaport.Addresses.OpenseaConduitKey[ValidChains.Ethereum],
    // Zone is missing in Addresses config for Goerli, but is same address
    Zone: "0x00000000e88fe2628ebc5da81d2b3cead633e89e",
    FeeRecipient: "0x0000a26b00c1f0df003000390027140000faa719",
  },
} as const;

export type SpentItem = {
  itemType: ItemType;
  token: string;
  identifier: string;
  amount: string;
};

export type ReceivedItem = {
  itemType: ItemType;
  token: string;
  identifier: string;
  amount: string;
  recipient: string;
};

export const ORDER_EIP712_TYPES = {
  OrderComponents: [
    { name: "offerer", type: "address" },
    { name: "zone", type: "address" },
    { name: "offer", type: "OfferItem[]" },
    { name: "consideration", type: "ConsiderationItem[]" },
    { name: "totalOriginalConsiderationItems", type: "uint256" },
    { name: "orderType", type: "uint8" },
    { name: "startTime", type: "uint256" },
    { name: "endTime", type: "uint256" },
    { name: "zoneHash", type: "bytes32" },
    { name: "salt", type: "uint256" },
    { name: "conduitKey", type: "bytes32" },
    { name: "counter", type: "uint256" },
  ],
  OfferItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifierOrCriteria", type: "uint256" },
    { name: "startAmount", type: "uint256" },
    { name: "endAmount", type: "uint256" },
  ],
  ConsiderationItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifierOrCriteria", type: "uint256" },
    { name: "startAmount", type: "uint256" },
    { name: "endAmount", type: "uint256" },
    { name: "recipient", type: "address" },
  ],
};

export const OPENSEA_LIST_FOR_SALE = gql`
  mutation openseaListForSale($input: OpenseaListForSaleInput!) {
    openseaListForSale(input: $input)
  }
`;

export class OpenseaPlatform extends AbstractPlatform {
  private exchangeContractWrapper: ContractWrapper;
  private chainId: 1 | 5;

  constructor(protected readonly refinable: Refinable) {
    super(refinable);

    if (
      refinable.chainId !== ValidChains.Ethereum &&
      refinable.chainId !== ValidChains.EthereumGoerli
    ) {
      throw new Error(`Opensea does not support chain ${refinable.chainId}`);
    }

    this.chainId = refinable.chainId;

    this.exchangeContractWrapper = new ContractWrapper(
      {
        address: Addresses[this.chainId].Exchange,
        chainId: this.chainId,
        abi: JSON.stringify(ExchangeAbi),
      },
      refinable.provider,
      {}
    );
  }

  getApprovalAddress(): string {
    // needed for token payment (buy)
    return Addresses[this.chainId].Exchange;
  }

  async buy(offer: PartialOffer, contractAddress: string, tokenId: string) {
    const chainId = offer.chainId;
    const chainConfig = new Chain(chainId);

    const currency = chainConfig.getCurrency(offer.price.currency);

    const nonce = await this.getNonce(this.refinable.accountAddress);

    const builder = new Seaport.Builders.SingleToken(this.refinable.chainId);

    const { orderParams } = offer;

    // THIS HAS TO BE A 1:1 MATCH TO order.orderParams
    const builtOrder = builder.build({
      side: "sell",
      tokenKind: "erc721",
      offerer: orderParams.parameters.offerer,
      contract: contractAddress,
      tokenId: tokenId,
      paymentToken: currency.address,
      price: orderParams.parameters.consideration[0].startAmount,
      counter: nonce,
      startTime: orderParams.parameters.startTime,
      endTime: orderParams.parameters.endTime,
      fees: orderParams.parameters.consideration
        .slice(1)
        .map(({ recipient, startAmount }) => ({
          recipient,
          amount: startAmount,
        })),
      signature: orderParams.signature,
      conduitKey: Addresses[this.chainId].ConduitKey,
      salt: orderParams.parameters.salt,
    });

    // Router supports only ETH transactions
    if (currency.address === constants.AddressZero) {
      const router = new Router.Router(
        this.chainId,
        this.refinable.evm.provider
      );
      return await router.fillListingsTx(
        [
          {
            kind: "seaport",
            contractKind: "erc721",
            contract: contractAddress,
            tokenId: tokenId,
            currency: currency.address,
            order: builtOrder,
          },
        ],
        this.refinable.accountAddress
      );
    } else {
      const exchange = new Seaport.Exchange(this.chainId);
      return exchange.fillOrderTx(
        this.refinable.accountAddress,
        builtOrder,
        { amount: "1" },
        {
          referrer: "refinable.com",
          conduitKey: Addresses[this.chainId].ConduitKey,
          recipient: this.refinable.accountAddress,
        }
      );
    }
  }

  async listForSale(
    nft: AbstractEvmNFT,
    offerPrice: Price,
    options: {
      onProgress?: <T extends ListStatus>(status: T) => void;
      onError?: (
        {
          step,
          platform,
        }: { step: LIST_STATUS_STEP; platform: Platform.Opensea },
        error
      ) => void;
    }
  ) {
    options.onProgress<ListApproveStatus>({
      platform: Platform.Opensea,
      step: LIST_STATUS_STEP.APPROVE,
      data: {
        addressToApprove: Seaport.Addresses.Exchange[this.chainId],
      },
    });

    await nft.approveIfNeeded(await this.getTokenConduitKeyAddress());

    const nonce = await this.getNonce(this.refinable.accountAddress);

    const currency = new Chain(this.chainId).getCurrency(offerPrice.currency);
    const price = utils.parseUnits(
      offerPrice.amount.toString(),
      currency.decimals
    );
    const item = nft.getItem();

    // OS fee is 2.5%
    const openseaFee = price.mul(250).div(10000);

    const now = Math.floor(Date.now() / 1000);

    const builder = new Seaport.Builders.SingleToken(this.refinable.chainId);

    /**
     * `msg.properties.totalOriginalConsiderationItems`: missing when sending req, re-added by backend
     * `msg.value`: added by backend, hex of total price
     */
    const builtOrder = builder.build({
      side: "sell",
      tokenKind: "erc721",
      offerer: this.refinable.accountAddress,
      contract: item.contractAddress,
      tokenId: item.tokenId,
      paymentToken: currency.address,
      price: price.sub(openseaFee).toString(),
      counter: nonce,
      startTime: now,
      endTime: now + 3600 * 24,
      conduitKey: Addresses[this.chainId].ConduitKey,
      fees: [
        {
          recipient: Addresses[this.chainId].FeeRecipient,
          amount: openseaFee.toString(),
        },
      ],
    });

    options.onProgress<ListSignStatus>({
      platform: Platform.Opensea,
      step: LIST_STATUS_STEP.SIGN,
      data: {
        hash: "",
        what: "Opensea order",
      },
    });

    await builtOrder.sign(this.refinable.evm.signer as any);

    const {
      signature: completeSignature,
      kind,
      offer,
      consideration,
      ...strippedOrderParams
    } = builtOrder.params;

    const input = {
      parameters: {
        ...strippedOrderParams,
        offer: offer.map(({ itemType, ...restOfOffer }) => {
          const mappedItemType = this.getMappedItemType(itemType);
          return { ...restOfOffer, itemType: mappedItemType };
        }),
        consideration: consideration.map(
          ({ itemType, ...restOfConsideration }) => {
            const mappedItemType = this.getMappedItemType(itemType);
            return { ...restOfConsideration, itemType: mappedItemType };
          }
        ),
      },
      signature: completeSignature,
    };

    options.onProgress<ListCreateStatus>({
      platform: Platform.Opensea,
      step: LIST_STATUS_STEP.CREATE,
    });

    console.log(input);

    const response = await this.refinable.graphqlClient.request<
      string,
      MutationOpenseaListForSaleArgs
    >(OPENSEA_LIST_FOR_SALE, {
      input,
    });

    return response;
  }

  private getMappedItemType(itemType: ItemType): OpenseaItemType {
    const enumKey =
      Object.keys(ItemType)[Object.values(ItemType).indexOf(itemType)];

    return enumKey as OpenseaItemType;
  }

  private async getNonce(makerAddress: string): Promise<string> {
    return (
      await this.exchangeContractWrapper.contract.getCounter(makerAddress)
    ).toString();
  }

  private async getTokenConduitKeyAddress(): Promise<string> {
    // needed for token transfer (sale)
    const conduitWrapper = new ContractWrapper(
      {
        chainId: this.chainId,
        address: Addresses[this.chainId].ConduitController,
        abi: JSON.stringify(ConduitControllerAbi),
      },
      this.refinable.provider
    );

    const makerConduit = await conduitWrapper.contract.getConduit(
      Addresses[this.chainId].ConduitKey
    );

    return makerConduit.conduit;
  }
}
