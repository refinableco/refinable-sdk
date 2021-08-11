import "isomorphic-unfetch";

import { PartialNFTItem } from "./nft/AbstractNFT";
import { ERC1155NFT } from "./nft/ERC1155NFT";
import { ERC721NFT } from "./nft/ERC721NFT";
import { CREATE_OFFERS, TOKEN_TYPE } from "./nft/nft";
import * as ethers from "ethers";
import { REFINABLE_CURRENCY } from "./constants/currency";
import { Client, createClient } from "@urql/core";

interface BaseData {
  contractAddress: string;
  tokenId: number;
  type: TOKEN_TYPE;
}

interface ListForSaleData extends BaseData {
  amount: number;
  supply: number;
  currency: REFINABLE_CURRENCY;
}

interface CancelSaleData extends BaseData {}

export class Refinable {
  private _apiClient?: Client;

  static create(provider: any, address: string, apiToken: string) {
    const refinable = new Refinable(provider, address);
    refinable.apiClient = createClient({
      url: "https://api.refinable.com/graphql",
      fetchOptions: () => {
        return {
          headers: {
            "X-API-KEY": apiToken,
          },
        };
      },
    });
    return refinable;
  }

  constructor(
    public readonly provider: ethers.Signer,
    public readonly account: string
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

  setApiClient(client: Client) {
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

  // SDK FUNCTIONS
  async putForSale(data: ListForSaleData) {
    const nft = this.createNft(data.type, {
      contractAddress: data.contractAddress,
      tokenId: data.tokenId,
    });

    const signature = await nft.putForSale(
      { currency: data.currency, amount: data.amount },
      data.supply
    );

    const result = await this.apiClient
      .mutation(CREATE_OFFERS, {
        input: {
          tokenId: data.tokenId,
          signature,
          type: "SALE",
          contractAddress: data.contractAddress,
          price: {
            currency: data.currency,
            amount: parseFloat(data.amount.toString()),
          },
          supply: 1,
        },
      })
      .toPromise();

    return result;
  }

  async cancelSale(data: CancelSaleData) {
    const nft = this.createNft(data.type, {
      contractAddress: data.contractAddress,
      tokenId: data.tokenId,
    });

    return nft.cancelSale();
  }

  createNft(type: TOKEN_TYPE, item: PartialNFTItem) {
    switch (type) {
      case TOKEN_TYPE.ERC721:
        return new ERC721NFT(this, item);
      case TOKEN_TYPE.ERC1155:
        return new ERC1155NFT(this, item);
    }
  }
}
