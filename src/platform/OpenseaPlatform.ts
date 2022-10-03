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
} from "../@types/graphql";
import { gql } from "graphql-request";
import { Refinable } from "../refinable/Refinable";
import { ContractWrapper } from "../refinable/contract/ContractWrapper";
import { AbstractEvmNFT } from "../nft/AbstractEvmNFT";
import { Chain as ValidChains } from "../interfaces/Network";

import ExchangeAbi from "./abis/OpenseaExchange.abi.json";
import ConduitControllerAbi from "./abis/OpenseaConduitController.abi.json";
import { CONTRACT_MAP } from "../config/contracts";
import { Chain } from "../refinable/Chain";
import {
  OrderComponents,
  OrderKind,
} from "@refinableco/reservoir-sdk/dist/seaport/types";

export const Addresses = {
  [ValidChains.Ethereum]: {
    Exchange: "0x00000000006c3852cbef3e08e8df289169ede581",
    ConduitController: "0x00000000f9490004c11cef243f5400493c00ad63",
    ServiceFee: CONTRACT_MAP[ValidChains.Ethereum].SERVICE_FEE_V2,
  },
  [ValidChains.EthereumGoerli]: {
    Exchange: "0x00000000006c3852cbef3e08e8df289169ede581",
    ConduitController: "0x00000000f9490004c11cef243f5400493c00ad63",
    ServiceFee: CONTRACT_MAP[ValidChains.EthereumGoerli].SERVICE_FEE_V2,
  },
  // [ValidChains.PolygonMainnet]: "0x00000000006c3852cbef3e08e8df289169ede581",
  // [ValidChains.PolygonTestnet]: "0x00000000006c3852cbef3e08e8df289169ede581",
};

export enum ItemType {
  NATIVE,
  ERC20,
  ERC721,
  ERC1155,
  // not supported by us
  // ERC721_WITH_CRITERIA,
  // ERC1155_WITH_CRITERIA,
}

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
  mutation openseaListForSale($input: String!) {
    openseaListForSale(input: $input)
  }
`;

export class OpenseaPlatform extends AbstractPlatform {
  // os supports contract-wide, token-list, bundle-ask as well
  private readonly kindOfSale = "single-token";
  private exchangeContractWrapper: ContractWrapper;
  private chainId: ValidChains;

  constructor(protected readonly refinable: Refinable, chainId: ValidChains) {
    super(refinable);
    this.chainId = chainId;
    this.exchangeContractWrapper = new ContractWrapper(
      {
        address: Addresses[chainId].Exchange,
        chainId,
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
      orderType: 0, // FULL_OPEN
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

    const openseaConduitKey =
      "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000";
    const openseaZone = "0x00000000e88fe2628ebc5da81d2b3cead633e89e";
    const openseaFeeRecipient = "0x0000a26b00c1f0df003000390027140000faa719";

    await this.approveIfNeeded(nft, openseaConduitKey);

    const nonce = await this.getNonce(this.refinable.accountAddress);

    const price = BigNumber.from(orderParams.price);

    const openseaFee = price.mul(25).div(1000);

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
    //       "totalOriginalConsiderationItems": 2,
    //       "orderType": 2,
    //       "startTime": 1664689246,
    //       "endTime": 1665898846,
    //       "zoneHash": "0x2ffeca829f4ed0599af3b88ffbd0e45e6d20e99525468739204bbde5d848d7f7",
    //       "salt": "0xe98c87161777ac6a6a6b4f69f55df9a1",
    //       "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
    //       "counter": "0"
    //     },
    //     "value": "0x2386f26fc10000"
    //   }

    const params: OrderComponents & {
      totalOriginalConsiderationItems: number;
    } = {
      kind: this.kindOfSale as OrderKind,
      offerer: this.refinable.accountAddress,
      zone: openseaZone, // OS zone
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
          token: "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
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
          token: "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",
          identifierOrCriteria: "0",
          startAmount: openseaFee.toString(),
          endAmount: openseaFee.toString(),
          recipient: openseaFeeRecipient,
        },
      ],
      totalOriginalConsiderationItems: 2,
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
      orderType: 2, // FULL_RESTRICTED ON OPENSEA
      startTime: orderParams.startTime,
      endTime: orderParams.endTime,
      salt: randomHex(16),
      conduitKey: openseaConduitKey, // OS CONDUITKEY
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
      ...strippedOrderParams
    } = order.params;

    // create
    const input = { ...strippedOrderParams, signature };

    console.log(input);
    options.onProgress<ListCreateStatus>({
      platform: Platform.Opensea,
      step: LIST_STATUS_STEP.CREATE,
    });

    const response = await this.refinable.graphqlClient.request<
      string,
      MutationOpenseaListForSaleArgs
    >(OPENSEA_LIST_FOR_SALE, {
      input: JSON.stringify(input),
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

  private async approveIfNeeded(nft: AbstractEvmNFT, conduitKey: string) {
    const conduitWrapper = new ContractWrapper(
      {
        chainId: this.chainId,
        address: Addresses[this.chainId].ConduitController,
        abi: JSON.stringify(ConduitControllerAbi),
      },
      this.refinable.provider
    );

    const makerConduit = await conduitWrapper.contract.getConduit(conduitKey);

    await nft.approveIfNeeded(makerConduit.conduit);
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
