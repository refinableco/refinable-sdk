import { Stream } from "form-data";
import { GraphQLClient } from "graphql-request";
import merge from "merge-options-default";
import { AbstractEvmNFT, RefinableEvmClient, SPLNFT } from "..";
import {
  GetUserItemsQuery,
  GetUserItemsQueryVariables,
  UserItemFilterType,
} from "../@types/graphql";
import { apiUrl } from "../config/sdk";
import { GET_USER_ITEMS } from "../graphql/items";
import { uploadFile } from "../graphql/utils";
import { ClassType, nftMap, NftMapTypes, SingleKeys } from "../interfaces";
import { Signer } from "../interfaces/Signer";
import { AbstractNFT, PartialNFTItem } from "../nft/AbstractNFT";
import {
  Environment,
  Options,
  RefinableOptions,
} from "../types/RefinableOptions";
import { limit } from "../utils/limitItems";
import { CheckoutClient } from "./checkout/CheckoutClient";
import { RefinableSolanaClient } from "./client/RefinableSolanaClient";
import { OfferClient } from "./offer/OfferClient";
import EvmSigner from "./signer/EvmSigner";
import SolanaSigner from "./signer/SolanaSigner";

export enum ClientType {
  Solana = "Solana",
  Evm = "Evm",
}

export class Refinable {
  protected _apiClient?: GraphQLClient;
  protected _options: Options<RefinableOptions> = {
    environment: Environment.Mainnet,
  };
  protected _apiKey: string;
  protected _accountAddress: string;
  protected _account?: Signer;
  protected _provider: any;

  // Clients
  public evm: RefinableEvmClient;
  public solana: RefinableSolanaClient;

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

    const graphqlUrl = apiUrl[this._options.environment];

    this._apiKey = apiToken;
    this.apiClient = new GraphQLClient(graphqlUrl, {
      headers:  { "X-API-KEY": apiToken, ...(this._options.headers ?? {}) },
    });

    this.evm = new RefinableEvmClient(options, this);
    this.solana = new RefinableSolanaClient(options, this);
  }

  async init() {
    await this.evm.init();
    await this.solana.init();
  }

  async connect(type: ClientType, provider: unknown) {
    this._provider = provider;

    if (type === ClientType.Evm) {
      this._account = new EvmSigner(this);
    } else {
      this._account = new SolanaSigner(this);
    }

    this._accountAddress = await this.account.getAddress();

    return this;
  }

  disconnect() {
    this._provider = null;
    this._accountAddress = null;
  }

  createNft<K extends NftMapTypes>(
    item: PartialNFTItem & { type: SingleKeys<K> }
  ): ClassType<K, SPLNFT | AbstractEvmNFT> {
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
    const queryResponse = await this.apiClient.request<
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
      this.apiClient,
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
}
