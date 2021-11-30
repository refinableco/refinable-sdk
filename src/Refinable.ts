import { utils, Signer } from "ethers";
import { Stream } from "form-data";
import { GraphQLClient } from "graphql-request";
import {
  GetUserItemsQuery,
  GetUserItemsQueryVariables,
  GetUserOfferItemsQuery,
  GetUserOfferItemsQueryVariables,
  TokenType,
} from "./@types/graphql";
import Account from "./Account";
import { apiUrl } from "./config/sdk";
import { GET_USER_ITEMS, GET_USER_OFFER_ITEMS } from "./graphql/items";
import { uploadFile } from "./graphql/utils";
import { ClassType, nftMap, SingleKeys } from "./interfaces";
import { AbstractNFT, PartialNFTItem } from "./nft/AbstractNFT";
import { NFTBuilder, NftBuilderParams } from "./nft/builder/NFTBuilder";
import { PartialOffer } from "./offer/Offer";
import { OfferFactory } from "./offer/OfferFactory";
import { RefinableBase, RefinableOptions } from "./RefinableBase";
import { RefinableContracts } from "./RefinableContracts";
import { Environment, RefinableOptions } from "./types/RefinableOptions";
import { limit } from "./utils/limitItems";

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

enum OfferType {
  Sale = "SALE",
  Auction = "AUCTION",
}
export enum UserItemFilterType {
  Created = "CREATED",
  Owned = "OWNED",
}

export class Refinable extends RefinableBase {
  public account: Account;
  public contracts: RefinableContracts;

  static async create(
    provider: Signer,
    apiOrBearerToken: string,
    options?: Partial<RefinableOptions>
  ) {
    const accountAddress = await provider.getAddress();
    const refinable = new Refinable(provider, accountAddress, options);

    if (!apiOrBearerToken) throw new Error("No authentication key present");

    const graphqlUrl = apiUrl[refinable._options.environment];

    refinable._apiKey = apiOrBearerToken;
    refinable.apiClient = new GraphQLClient(graphqlUrl, {
      headers:
        apiOrBearerToken.length === 32
          ? { "X-API-KEY": apiOrBearerToken }
          : { authorization: `Bearer ${apiOrBearerToken}` },
    });

    refinable.account = new Account(accountAddress, refinable);
    refinable.contracts = new RefinableContracts(refinable);

    await refinable.contracts.initialize();

    return refinable;
  }

  constructor(
    public readonly provider: Signer,
    public readonly accountAddress: string,
    options: Partial<RefinableOptions> = {}
  ) {
    super();
  
    const { waitConfirmations = 3, environment = Environment.Mainnet } =
      options;

    this._options = {
      waitConfirmations,
      environment,
    };
  }

  nftBuilder(params?: NftBuilderParams) {
    return new NFTBuilder(this, params);
  }

  setApiClient(client: GraphQLClient) {
    this.apiClient = client;
  }

  async personalSign(message: string) {
    const signature = await this.provider.signMessage(utils.arrayify(message));

    // WARNING! DO NOT remove!
    // this piece of code seems strange, but it fixes a lot of signatures that are faulty due to ledgers
    // ethers includes a lot of logic to fix these incorrect signatures
    // incorrect signatures often end on 00 or 01 instead of 1b or 1c, ethers has support for this
    const pieces = utils.splitSignature(signature);
    const reconstructed = utils.joinSignature(pieces);

    return reconstructed;
  }

  createOffer<K extends OfferType>(
    offer: PartialOffer & { type: K },
    nft: AbstractNFT
  ) {
    return OfferFactory.createOffer<K>(this, offer, nft);
  }

  createNft<K extends TokenType>(
    item: PartialNFTItem & { type: SingleKeys<K> }
  ): ClassType<K, AbstractNFT> {
    if (!item) return null;

    const Class = nftMap[item.type as TokenType];

    if (!Class) throw new Error("Item type not supported");

    return new Class(this, item)
  }

  private async getItemsWithOffer(
    paging = 30,
    after?: string,
    type?: OfferType
  ): Promise<GetUserOfferItemsQuery["user"]["itemsOnOffer"] | []> {
    const itemsPerPage = limit(paging);
    const queryResponse = await this.apiClient.request<
      GetUserOfferItemsQuery,
      GetUserOfferItemsQueryVariables
    >(GET_USER_OFFER_ITEMS, {
      ethAddress: this.accountAddress,
      filter: { type },
      paging: {
        first: itemsPerPage,
        after: after,
      },
    });
    return queryResponse?.user?.itemsOnOffer ?? [];
  }

  async getItemsOnSale(
    paging = 30,
    after?: string
  ): Promise<GetUserOfferItemsQuery["user"]["itemsOnOffer"] | []> {
    return this.getItemsWithOffer(paging, after, OfferType.Sale);
  }

  async getItemsOnAuction(
    paging = 30,
    after?: string
  ): Promise<GetUserOfferItemsQuery["user"]["itemsOnOffer"] | []> {
    return this.getItemsWithOffer(paging, after, OfferType.Auction);
  }

  private async getItems(
    paging = 30,
    filter: UserItemFilterType,
    after?: string
  ): Promise<GetUserItemsQuery["user"]["items"] | []> {
    const itemsPerPage = limit(paging);
    const queryResponse = await this.apiClient.request<
      GetUserItemsQuery,
      GetUserItemsQueryVariables
    >(GET_USER_ITEMS, {
      ethAddress: this.accountAddress,
      filter: { type: filter },
      paging: {
        first: itemsPerPage,
        after: after,
      },
    });
    return queryResponse?.user?.items ?? [];
  }

  async getCreatedItems(
    paging = 30,
    after?: string
  ): Promise<GetUserItemsQuery["user"]["items"] | []> {
    const filter = UserItemFilterType.Created;
    return this.getItems(paging, filter, after);
  }

  async getOwnedItems(
    paging = 30,
    after?: string
  ): Promise<GetUserItemsQuery["user"]["items"] | []> {
    const filter = UserItemFilterType.Owned;
    return this.getItems(paging, filter, after);
  }

  // Upload image / video
  public async uploadFile(file: Stream): Promise<string> {
    const { uploadFile: uploadedFileName } = await uploadFile(
      this.apiClient,
      file
    );

    if (!uploadedFileName) {
      throw new Error("Couldn't upload image for NFT");
    }

    return uploadedFileName;
  }
}
