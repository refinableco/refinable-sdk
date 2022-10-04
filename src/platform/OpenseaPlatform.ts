import { BigNumber, constants, utils } from "ethers/lib/ethers";
import { PartialOffer } from "../offer/Offer";
import { AbstractPlatform } from "./AbstractPlatform";
import { Seaport } from "@refinableco/reservoir-sdk";
import { randomHex } from "web3-utils";
import { Types } from "@refinableco/reservoir-sdk/dist/looks-rare";
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
  PriceCurrency,
  TokenType,
  OpenseaItemType,
} from "../@types/graphql";
import { gql } from "graphql-request";
import { Refinable } from "../refinable/Refinable";
import { ContractWrapper } from "../refinable/contract/ContractWrapper";
import { AbstractEvmNFT } from "../nft/AbstractEvmNFT";
import { Chain as ValidChains } from "../interfaces/Network";

import ExchangeAbi from "@refinableco/reservoir-sdk/dist/seaport/abis/Exchange.json";
import ConduitControllerAbi from "@refinableco/reservoir-sdk/dist/seaport/abis/ConduitController.json";
import { Chain } from "../refinable/Chain";
import {
  ItemType,
  OrderComponents,
  OrderKind,
} from "@refinableco/reservoir-sdk/dist/seaport/types";

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
  // os supports contract-wide, token-list, bundle-ask as well
  private readonly kindOfSale = "single-token";
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
    return Seaport.Addresses.Exchange[this.chainId];
  }

  async buy(offer: PartialOffer, contractAddress: string, tokenId: string) {
    throw new Error("Buy method not implemented yet");

    const chainId = offer.chainId;
    const fixedSignature = this.fixSignature(offer.orderParams.signature);

    const exchange = new Seaport.Exchange(chainId);

    const chainConfig = new Chain(chainId);

    const currency = chainConfig.getCurrency(offer.price.currency);

    const tokenContractWrapper = new ContractWrapper(
      { address: contractAddress, abi: "", chainId },
      this.refinable.provider
    );

    const tokenType = Object.keys(
      tokenContractWrapper.contract.functions
    ).includes("ownerOf")
      ? ItemType.ERC721
      : ItemType.ERC1155;

    const params: OrderComponents = {
      kind: this.kindOfSale as OrderKind,
      offerer: offer.user.ethAddress,
      zone: constants.AddressZero,
      offer: [
        {
          itemType:
            PriceCurrency.Eth === offer.price.currency
              ? ItemType.NATIVE
              : ItemType.ERC20,
          token: currency.address,
          identifierOrCriteria: tokenId,
          startAmount: offer.price.amount.toString(),
          endAmount: offer.price.amount.toString(),
        },
      ],
      consideration: [
        {
          itemType: tokenType,
          token: contractAddress,
          identifierOrCriteria: tokenId,
          startAmount:
            tokenType === ItemType.ERC1155
              ? offer.supply.toString() ?? "1"
              : "1",
          endAmount:
            tokenType === ItemType.ERC1155
              ? offer.supply.toString() ?? "1"
              : "1",
          recipient: this.refinable.accountAddress,
        },
      ],
      // NO FEES FOR NOW TO GET IT WORKING
      //   ...(params.fees || []).map(({ amount, endAmount, recipient }) => ({
      //     itemType:
      //       params.paymentToken === AddressZero
      //         ? Types.ItemType.NATIVE
      //         : Types.ItemType.ERC20,
      //     token: params.paymentToken,
      //     identifierOrCriteria: "0",
      //     startAmount: s(amount),
      //     endAmount: s(endAmount ?? amount),
      //     recipient,
      //   })),
      orderType: 2, // FULL_RESTRICTED
      startTime: offer.startTime,
      endTime: offer.endTime,
      zoneHash: constants.HashZero,
      salt: randomHex(16),
      conduitKey: constants.HashZero,
      counter: await this.getNonce(this.refinable.accountAddress),
      signature: fixedSignature,
    };

    const order = new Seaport.Order(this.chainId, params);

    const unsignedTx = exchange.fillOrderTx(
      this.refinable.accountAddress,
      order,
      {
        amount: offer.supply.toString(),
      }
    );

    return unsignedTx;
  }

  async listForSale(
    nft: AbstractEvmNFT,
    orderParams: Types.MakerOrderParams,
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
    // approve
    options.onProgress<ListApproveStatus>({
      platform: Platform.Opensea,
      step: LIST_STATUS_STEP.APPROVE,
      data: {
        addressToApprove: Seaport.Addresses.Exchange[this.chainId],
      },
    });

    await this.approveIfNeeded(nft);

    const nonce = await this.getNonce(this.refinable.accountAddress);

    const price = BigNumber.from(orderParams.price);

    const openseaFee = price.mul(250).div(10000);

    // {
    //     "signature": "0x",
    //     "parameters": {
    //       "offerer": "0x9fe893f7fc9a46825d4449fef0811ab00eb5b759",
    //       "zone": "0x00000000e88fe2628ebc5da81d2b3cead633e89e",
    //       "offer": [
    //         {
    //           "itemType": 2,
    //           "token": "0x306d717d109e0995e0f56027eb93d9c1d5686de1",
    //           "identifierOrCriteria": "31",
    //           "startAmount": "1",
    //           "endAmount": "1"
    //         }
    //       ],
    //       "consideration": [
    //         {
    //           "itemType": 1,
    //           "token": "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
    //           "identifierOrCriteria": "0",
    //           "startAmount": "9750000000000000",
    //           "endAmount": "9750000000000000",
    //           "recipient": "0x9fe893f7fc9a46825d4449fef0811ab00eb5b759"
    //         },
    //         {
    //           "itemType": 1,
    //           "token": "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
    //           "identifierOrCriteria": "0",
    //           "startAmount": "250000000000000",
    //           "endAmount": "250000000000000",
    //           "recipient": "0x0000a26b00c1f0df003000390027140000faa719"
    //         }
    //       ],
    //       ->>> Prop below added by backend, has to be signed though
    //       "totalOriginalConsiderationItems": 2,
    //       "orderType": 2,
    //       "startTime": 1664689246,
    //       "endTime": 1665898846,
    //       "zoneHash": "0x2ffeca829f4ed0599af3b88ffbd0e45e6d20e99525468739204bbde5d848d7f7",
    //       "salt": "0xe98c87161777ac6a6a6b4f69f55df9a1",
    //       "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
    //       "counter": "0"
    //     },
    //     ->>> Prop below added by backend
    //     "value": "0x2386f26fc10000"
    //   }

    const params: OrderComponents & {
      totalOriginalConsiderationItems: number;
    } = {
      kind: this.kindOfSale as OrderKind,
      offerer: this.refinable.accountAddress,
      zone: Addresses[this.chainId].Zone,
      zoneHash: randomHex(32),
      offer: [
        {
          itemType:
            nft.type === TokenType.Erc1155 ? ItemType.ERC1155 : ItemType.ERC721,
          token: orderParams.collection,
          identifierOrCriteria: orderParams.tokenId,
          startAmount:
            nft.type === TokenType.Erc1155 ? orderParams.amount ?? "1" : "1",
          endAmount:
            nft.type === TokenType.Erc1155 ? orderParams.amount ?? "1" : "1",
        },
      ],
      // BETWEEN 2 and 7 considerations (price + fees)
      consideration: [
        {
          itemType:
            orderParams.currency === constants.AddressZero
              ? ItemType.NATIVE
              : ItemType.ERC20,
          token: orderParams.currency,
          identifierOrCriteria: "0",
          startAmount: price.sub(openseaFee).toString(),
          endAmount: price.sub(openseaFee).toString(),
          recipient: this.refinable.accountAddress,
        },
        {
          itemType:
            orderParams.currency === constants.AddressZero
              ? ItemType.NATIVE
              : ItemType.ERC20,
          token: orderParams.currency,
          identifierOrCriteria: "0",
          startAmount: openseaFee.toString(),
          endAmount: openseaFee.toString(),
          recipient: Addresses[this.chainId].FeeRecipient,
        },
      ],
      totalOriginalConsiderationItems: 2,
      orderType: 2, // FULL_RESTRICTED ON OPENSEA
      startTime: orderParams.startTime,
      endTime: orderParams.endTime,
      salt: randomHex(16),
      conduitKey: Addresses[this.chainId].ConduitKey,
      counter: nonce,
    };

    const hash = this.hash(params);

    options.onProgress<ListSignStatus>({
      platform: Platform.Opensea,
      step: LIST_STATUS_STEP.SIGN,
      data: {
        hash,
        what: "Opensea order",
      },
    });

    const paramsSignature = await this.refinable.account.sign(hash);

    const order = new Seaport.Order(this.chainId, {
      ...params,
      signature: paramsSignature,
    });

    const signature = await this.refinable.account.sign(
      order.getSignatureData()
    );

    const {
      signature: completeSignature,
      kind,
      offer,
      consideration,
      ...strippedOrderParams
    } = order.params;

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
      signature,
    };

    options.onProgress<ListCreateStatus>({
      platform: Platform.Opensea,
      step: LIST_STATUS_STEP.CREATE,
    });

    const response = await this.refinable.graphqlClient.request<
      string,
      MutationOpenseaListForSaleArgs
    >(OPENSEA_LIST_FOR_SALE, {
      input,
    });

    return response;
  }

  private hash(params: OrderComponents) {
    return utils._TypedDataEncoder.hashStruct(
      "OrderComponents",
      ORDER_EIP712_TYPES,
      params
    );
  }

  private async approveIfNeeded(nft: AbstractEvmNFT) {
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

    await nft.approveIfNeeded(makerConduit.conduit);
  }

  private getMappedItemType(itemType: ItemType): OpenseaItemType {
    const enumKey =
      Object.keys(ItemType)[Object.values(ItemType).indexOf(itemType)];

    return enumKey as OpenseaItemType;
  }

  //   private async checkFillability(params: OrderComponents) {
  //     const status = await this.exchangeContractWrapper.contract.getOrderStatus();
  //     if (status.isCancelled) {
  //       throw new Error("not-fillable");
  //     }
  //     if (status.isValidated && BigNumber.from(status.totalFilled).gte(status.totalSize)) {
  //       throw new Error("not-fillable");
  //     }

  //     const makerConduit = Addresses[this.chainId].Exchange

  //     const info = this.getInfo() as BaseOrderInfo;
  //     if (info.side === "buy") {
  //       // Check that maker has enough balance to cover the payment
  //       // and the approval to the corresponding conduit is set
  //       const erc20 = new Common.Helpers.Erc20(provider, info.paymentToken);
  //       const balance = await erc20.getBalance(this.params.offerer);
  //       if (bn(balance).lt(info.price)) {
  //         throw new Error("no-balance");
  //       }

  //       // Check allowance
  //       const allowance = await erc20.getAllowance(
  //         this.params.offerer,
  //         makerConduit
  //       );
  //       if (bn(allowance).lt(info.price)) {
  //         throw new Error("no-approval");
  //       }
  //     } else {
  //       if (info.tokenKind === "erc721") {
  //         const erc721 = new Common.Helpers.Erc721(provider, info.contract);

  //         // Check ownership
  //         const owner = await erc721.getOwner(info.tokenId!);
  //         if (lc(owner) !== lc(this.params.offerer)) {
  //           throw new Error("no-balance");
  //         }

  //         // Check approval
  //         const isApproved = await erc721.isApproved(
  //           this.params.offerer,
  //           makerConduit
  //         );
  //         if (!isApproved) {
  //           throw new Error("no-approval");
  //         }
  //       } else {
  //         const erc1155 = new Common.Helpers.Erc1155(provider, info.contract);

  //         // Check balance
  //         const balance = await erc1155.getBalance(
  //           this.params.offerer,
  //           info.tokenId!
  //         );
  //         if (bn(balance).lt(info.amount)) {
  //           throw new Error("no-balance");
  //         }

  //         // Check approval
  //         const isApproved = await erc1155.isApproved(
  //           this.params.offerer,
  //           makerConduit
  //         );
  //         if (!isApproved) {
  //           throw new Error("no-approval");
  //         }
  //       }
  //     }
  //   }

  private fixSignature(signature: string) {
    // Ensure `v` is always 27 or 28 (Seaport will revert otherwise)
    if (signature?.length === 132) {
      let lastByte = parseInt(signature.slice(-2), 16);
      if (lastByte < 27) {
        if (lastByte === 0 || lastByte === 1) {
          lastByte += 27;
        } else {
          throw new Error("Invalid `v` byte");
        }

        return signature.slice(0, -2) + lastByte.toString(16);
      }
    }

    return signature;
  }

  private async getNonce(makerAddress: string): Promise<string> {
    return (
      await this.exchangeContractWrapper.contract.getCounter(makerAddress)
    ).toString();
  }
}
