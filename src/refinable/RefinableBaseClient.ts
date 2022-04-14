import { Stream } from "form-data";
import { GraphQLClient } from "graphql-request";
import merge from "merge-options-default";
import {
  GetOfferQuery,
  GetOfferQueryVariables,
  GetUserItemsQuery,
  GetUserItemsQueryVariables,
  GetUserOfferItemsQuery,
  GetUserOfferItemsQueryVariables,
  OfferFragment,
  TokenType,
  UserItemFilterType,
} from "../@types/graphql";
import { apiUrl } from "../config/sdk";
import {
  GET_OFFER,
  GET_USER_ITEMS,
  GET_USER_OFFER_ITEMS,
} from "../graphql/items";
import { uploadFile } from "../graphql/utils";
import { Account } from "../interfaces/Account";
import { AbstractNFT, PartialNFTItem } from "../nft/AbstractNFT";
import { Offer, PartialOffer } from "../offer/Offer";
import { OfferFactory } from "../offer/OfferFactory";
import {
  Environment,
  Options,
  RefinableOptions,
} from "../types/RefinableOptions";
import { limit } from "../utils/limitItems";

const defaultOptions: RefinableOptions = {
  environment: Environment.Mainnet,
};

// If we dont again define this, types break
export enum OfferType {
  Auction = "AUCTION",
  Sale = "SALE",
}

export abstract class RefinableBaseClient<O extends object = {}> {
  protected _apiClient?: GraphQLClient;
  protected _options: Options<O>;
  protected _apiKey: string;
  protected accountAddress: string;
  protected account: Account;

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

  constructor(
    apiOrBearerToken: string,
    options: Options<O>,
    defaultClientOptions?: Options<O>
  ) {
    if (!apiOrBearerToken) throw new Error("No authentication key present");

    this._options = merge(
      defaultOptions as any,
      defaultClientOptions ?? {},
      options
    );

    const graphqlUrl = apiUrl[this._options.environment];

    this._apiKey = apiOrBearerToken;
    this.apiClient = new GraphQLClient(graphqlUrl, {
      headers:
        apiOrBearerToken.length === 32
          ? { "X-API-KEY": apiOrBearerToken }
          : { authorization: `Bearer ${apiOrBearerToken}` },
    });
  }

  abstract init(): void | Promise<void>;
  abstract createNft(item: PartialNFTItem & { type: TokenType }): AbstractNFT;

  createOffer<K extends OfferType>(
    offer: PartialOffer & { type: K },
    nft: AbstractNFT
  ) {
    return OfferFactory.createOffer<K>(this, offer, nft);
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

  async getOffer<O extends Offer = Offer>(
    id: string,
    storeId?: string
  ): Promise<O> {
    const queryResponse = await this.apiClient.request<
      GetOfferQuery,
      GetOfferQueryVariables
    >(GET_OFFER, {
      id,
      storeId,
    });

    if (!queryResponse?.offer) return null;

    const nft = this.createNft(queryResponse?.offer?.item);

    return OfferFactory.createOffer(this, queryResponse?.offer, nft) as any;
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
