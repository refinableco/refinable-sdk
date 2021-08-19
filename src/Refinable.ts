import "isomorphic-unfetch";

import { PartialNFTItem } from "./nft/AbstractNFT";
import { ERC1155NFT } from "./nft/ERC1155NFT";
import { ERC721NFT } from "./nft/ERC721NFT";
import { TOKEN_TYPE } from "./nft/nft";
import * as ethers from "ethers";
import { REFINABLE_CURRENCY } from "./constants/currency";
import { GRAPHQL_URL } from "./constants";
import { GraphQLClient } from "graphql-request";

interface BaseData {
  contractAddress: string;
  tokenId: number;
  type: TOKEN_TYPE;
}

interface NftRegistry {
  [TOKEN_TYPE.ERC721]: ERC721NFT;
  [TOKEN_TYPE.ERC1155]: ERC1155NFT;
}

interface RefinableOptions {
  waitConfirmations: number;
}
export class Refinable {
  private _apiClient?: GraphQLClient;

  static create(provider: any, address: string, apiToken: string) {
    const refinable = new Refinable(provider, address);

    refinable.apiClient = new GraphQLClient(GRAPHQL_URL, {
      headers: { "X-API-KEY": apiToken },
    });

    return refinable;
  }

  constructor(
    public readonly provider: ethers.Signer,
    public readonly account: string,
    public readonly options: RefinableOptions = {
      waitConfirmations: 3,
    }
  ) {}

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
        nft = new ERC721NFT(this, item) as NftRegistry[K];
    }

    return nft.build() as Promise<NftRegistry[K]>;
  }
}
