import "isomorphic-unfetch";

import { PartialNFTItem } from "./nft/AbstractNFT";
import { ERC1155NFT } from "./nft/ERC1155NFT";
import { ERC721NFT } from "./nft/ERC721NFT";
import { TOKEN_TYPE } from "./nft/nft";
import * as ethers from "ethers";
import { GraphQLClient } from "graphql-request";
import { Chain } from "./interfaces/Network";
import { GET_REFINABLE_CONTRACT } from "./graphql/contracts";
import {
  GetUserOfferItemsQuery,
  GetUserOfferItemsQueryVariables,
  GetUserItemsQuery,
  GetUserItemsQueryVariables,
} from "./@types/graphql";
import { GET_USER_ITEMS, GET_USER_OFFER_ITEMS } from "./graphql/items";

export interface NftRegistry {
  [TOKEN_TYPE.ERC721]: ERC721NFT;
  [TOKEN_TYPE.ERC1155]: ERC1155NFT;
}

export type ContractType =
  | "ERC721_TOKEN"
  | "ERC1155_TOKEN"
  | "ERC721_AUCTION"
  | "ERC1155_AUCTION"
  | "ERC721_SALE"
  | "ERC1155_SALE"
  | "ERC721_SALE_NONCE_HOLDER"
  | "ERC1155_SALE_NONCE_HOLDER"
  | "TRANSFER_PROXY"
  | "ERC721SaleNonceHolder"
  | "ERC1155SaleNonceHolder"
  | "ERC721Airdrop"
  | "ERC1155Airdrop"
  | "ERC721Auction"
  | "ERC1155Auction"
  | "TransferProxy";

export type AllContractTypes =
  | ContractType
  | "ServiceFeeProxy"
  | "ERC20"
  | "RefinableERC721WhiteListedToken"
  | "RefinableERC721WhiteListedTokenV2";

interface RefinableOptions {
  waitConfirmations: number;
}

enum OfferType {
  Sale = "SALE",
  Auction = "AUCTION",
}
export enum UserItemFilterType {
  Created = "CREATED",
  Owned = "OWNED",
}
export class Refinable {
  private _apiClient?: GraphQLClient;
  private _options: RefinableOptions;
  private _apiKey: string;

  static async create(
    provider: ethers.Signer,
    apiToken: string,
    options?: Partial<RefinableOptions>
  ) {
    const accountAddress = await provider.getAddress();
    const refinable = new Refinable(provider, accountAddress, options);

    const graphqlUrl =
      process.env.GRAPHQL_URL ?? "https://api.refinable.com/graphql";

    refinable._apiKey = apiToken;
    refinable.apiClient = new GraphQLClient(graphqlUrl, {
      headers: { "X-API-KEY": apiToken },
    });

    return refinable;
  }

  constructor(
    public readonly provider: ethers.Signer,
    public readonly accountAddress: string,
    options: Partial<RefinableOptions> = {}
  ) {
    const { waitConfirmations = 3 } = options;

    this._options = {
      waitConfirmations,
    };
  }

  get apiKey() {
    return this._apiKey;
  }

  get options() {
    return this._options;
  }

  get apiClient() {
    if (!this._apiClient) {
      throw new Error("Api Client was not initialized");
    }
    return this._apiClient;
  }

  set apiClient(apiClient) {
    this._apiClient = apiClient;
  }

  setApiClient(client: GraphQLClient) {
    this.apiClient = client;
  }

  async personalSign(message: string) {
    const signature = await this.provider.signMessage(
      ethers.utils.arrayify(message)
    );

    // WARNING! DO NOT remove!
    // this piece of code seems strange, but it fixes a lot of signatures that are faulty due to ledgers
    // ethers includes a lot of logic to fix these incorrect signatures
    // incorrect signatures often end on 00 or 01 instead of 1b or 1c, ethers has support for this
    const pieces = ethers.utils.splitSignature(signature);
    const reconstructed = ethers.utils.joinSignature(pieces);

    return reconstructed;
  }

  async createNft<K extends keyof NftRegistry>(
    type: K,
    item: PartialNFTItem
  ): Promise<NftRegistry[K]> {
    let nft;

    switch (type) {
      case TOKEN_TYPE.ERC721:
        nft = new ERC721NFT(this, item) as NftRegistry[K];
        break;
      case TOKEN_TYPE.ERC1155:
        nft = new ERC1155NFT(this, item) as NftRegistry[K];
        break;
      default:
        throw new Error("This type is not supported yet");
    }

    return nft.build() as Promise<NftRegistry[K]>;
  }

  getContracts(chainId: Chain, types: ContractType[]) {
    return this.apiClient.request(GET_REFINABLE_CONTRACT, {
      input: { types, chainId: chainId },
    });
  }

  async getItemsOnSale(paging = 30): Promise<any> {
    const queryResponse = await this.apiClient.request<
      GetUserOfferItemsQuery,
      GetUserOfferItemsQueryVariables
    >(GET_USER_OFFER_ITEMS, {
      ethAddress: this.accountAddress,
      filter: { type: OfferType.Sale },
      paging: {
        first: paging,
      },
    });
    return queryResponse?.user?.itemsOnOffer;
  }

  async getItemsOnAuction(paging = 30): Promise<any> {
    const queryResponse = await this.apiClient.request<
      GetUserOfferItemsQuery,
      GetUserOfferItemsQueryVariables
    >(GET_USER_OFFER_ITEMS, {
      ethAddress: this.accountAddress,
      filter: { type: OfferType.Auction },
      paging: {
        first: paging,
      },
    });
    return queryResponse?.user?.itemsOnOffer;
  }

  async getItems(
    paging = 30,
    filter: UserItemFilterType = UserItemFilterType.Owned
  ): Promise<any> {
    const queryResponse = await this.apiClient.request<
      GetUserItemsQuery,
      GetUserItemsQueryVariables
    >(GET_USER_ITEMS, {
      ethAddress: this.accountAddress,
      filter: { type: filter },
      paging: {
        first: paging,
      },
    });
    return queryResponse?.user?.items;
  }
}
