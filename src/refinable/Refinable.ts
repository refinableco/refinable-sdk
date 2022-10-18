import axios, { AxiosInstance } from "axios";
import { ethers, providers } from "ethers";
import { Stream } from "form-data";
import { GraphQLClient } from "graphql-request";
import merge from "merge-options-default";
import { AbstractEvmNFT, RefinableEvmClient } from "..";
import {
  GetUserItemsQuery,
  GetUserItemsQueryVariables,
  Platform,
  UserItemFilterType,
} from "../@types/graphql";
import { apiUrl, graphqlUrl } from "../config/sdk";
import { GET_USER_ITEMS } from "../graphql/items";
import { uploadFile } from "../graphql/utils";
import { ClassType, nftMap, NftMapTypes, SingleKeys } from "../interfaces";
import { AccountSigner, ProviderSignerWallet } from "../interfaces/Signer";
import { PartialNFTItem } from "../nft/AbstractNFT";
import { platforms } from "../platform";
import { AbstractPlatform } from "../platform/AbstractPlatform";
import {
  Environment,
  Options,
  RefinableOptions,
} from "../types/RefinableOptions";
import { limit } from "../utils/limitItems";
import { CheckoutClient } from "./checkout/CheckoutClient";
import { CoinClient } from "./coin/CoinClient";
import { OfferClient } from "./offer/OfferClient";
import EvmSigner from "./signer/EvmSigner";

export enum ClientType {
  Evm = "Evm",
}

export class Refinable {
  protected _graphqlClient?: GraphQLClient;
  protected _apiClient?: AxiosInstance;
  protected _options: Options<RefinableOptions> = {
    environment: Environment.Mainnet,
  };
  protected _apiKey: string;
  protected _accountAddress: string;
  protected _account?: AccountSigner;
  protected _provider: any;
  protected _chainId: number;

  // Clients
  public evm: RefinableEvmClient;

  get options() {
    return this._options;
  }

  get graphqlClient() {
    if (!this._graphqlClient) {
      throw new Error("GraphQL Client was not initialized");
    }
    return this._graphqlClient;
  }

  set graphqlClient(graphqlClient) {
    this._graphqlClient = graphqlClient;
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

  get provider() {
    if (!this._provider)
      throw new Error("Provider not set, please connect() provider first");
    return this._provider;
  }

  get account() {
    if (!this._account)
      throw new Error("Account not set, please connect() provider first");
    return this._account;
  }

  get chainId() {
    if (!this._chainId)
      throw new Error("ChainId not set, please connect() provider first");
    return this._chainId;
  }

  get accountAddress() {
    return this._accountAddress;
  }

  get isAuthenticated() {
    return !!this._account && !!this._accountAddress;
  }

  static async create(apiToken: string, options?: Options<RefinableOptions>) {
    const refinable = new Refinable(apiToken, options);

    await refinable.init();

    return refinable;
  }

  constructor(apiToken: string, options: RefinableOptions = {}) {
    if (!apiToken) throw new Error("No authentication key present");

    this._options = merge(
      this.options, // default options
      options
    );

    const _graphqlUrl = graphqlUrl[this._options.environment];
    const _apiUrl = apiUrl[this._options.environment];

    this._apiKey = apiToken;
    this.graphqlClient = new GraphQLClient(_graphqlUrl, {
      headers: { "X-API-KEY": apiToken, ...(this._options.headers ?? {}) },
    });
    this.apiClient = axios.create({
      baseURL: _apiUrl,
      headers: {
        "X-API-KEY": apiToken,
        ...(this._options.headers ?? {}),
        "content-type": "application/JSON",
      },
    });

    this.evm = new RefinableEvmClient(options, this);
  }

  async init() {
    await this.evm.init();
  }

  async connect(type: ClientType, providerOrSigner: ProviderSignerWallet) {
    this._provider = providerOrSigner;

    this.evm.connect(providerOrSigner);
    this._account = new EvmSigner(providerOrSigner, this.evm.options);

    const { chainId } = await this.evm.provider.getNetwork();
    this._chainId = chainId;

    this._accountAddress = await this.account.getAddress();

    return this;
  }

  disconnect() {
    this._provider = null;
    this._accountAddress = null;
    this._chainId = null;

    this.evm.disconnect();
  }

  createNft<K extends NftMapTypes>(
    item: PartialNFTItem & { type: SingleKeys<K> }
  ): ClassType<K, AbstractEvmNFT> {
    if (!item) return null;

    const Class = nftMap[item.type as NftMapTypes];

    if (!Class) throw new Error("Item type not supported");

    return new Class(this, item);
  }

  private async getItems(
    paging = 30,
    filter: UserItemFilterType,
    after?: string
  ): Promise<GetUserItemsQuery["user"]["items"] | []> {
    const itemsPerPage = limit(paging);
    const queryResponse = await this.graphqlClient.request<
      GetUserItemsQuery,
      GetUserItemsQueryVariables
    >(GET_USER_ITEMS, {
      ethAddress: this._accountAddress,
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
      this.graphqlClient,
      file
    );

    if (!uploadedFileName) {
      throw new Error("Couldn't upload image for NFT");
    }

    return uploadedFileName;
  }

  get checkout(): CheckoutClient {
    return new CheckoutClient(this);
  }

  get offer(): OfferClient {
    return new OfferClient(this);
  }

  get coin(): CoinClient {
    return new CoinClient(this);
  }

  platform(platform: Platform): AbstractPlatform {
    if (!platforms[platform]) {
      throw new Error("Platform is not supported");
    }
    return new platforms[platform](this);
  }
}
