/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { Refinable } from "../Refinable";
import { AbstractNFT, PartialNFTItem } from "./AbstractNFT";
import { TOKEN_TYPE } from "./nft";
import { Price } from "../constants/currency";
import { soliditySha3 } from "web3-utils";
import { IRoyalty } from "./royaltyStrategies/Royalty";
import { CREATE_ITEM, FINISH_MINT } from "../graphql/mint";
import {
  CreateItemMutation,
  FinishMintMutation,
  FinishMintMutationVariables,
  CreateItemMutationVariables,
  CreateItemInput,
} from "../@types/graphql";
import { uploadFile } from "../graphql/utils";
import { CREATE_OFFERS } from "../graphql/sale";

export class ERC721NFT extends AbstractNFT {
  constructor(
    protected readonly refinable: Refinable,
    protected readonly item: PartialNFTItem
  ) {
    super(TOKEN_TYPE.ERC721, refinable, item);
  }

  approve(operatorAddress: string): Promise<TransactionResponse> {
    return this.mintContract.setApprovalForAll(operatorAddress, true);
  }

  async putForSale(price: Price): Promise<string> {
    this.verifyItem();

    if (!this.item.tokenId) {
      throw new Error("tokenId is not set");
    }

    if (!this.item.contractAddress) {
      throw new Error("contract address is not set");
    }

    await this.approveIfNeeded(this.transferProxyContract.addresss);

    const saleParamsHash = await this.getSaleParamsHash(
      price,
      this.refinable.accountAddress
    );

    const signedHash = await this.refinable.personalSign(
      saleParamsHash as string
    );

    const result = await this.refinable.apiClient.request(CREATE_OFFERS, {
      input: {
        tokenId: this.item.tokenId,
        signature: signedHash,
        type: "SALE",
        contractAddress: this.item.contractAddress,
        price: {
          currency: price.currency,
          amount: parseFloat(price.amount.toString()),
        },
        supply: 1,
      },
    });

    return result;
  }

  async isApproved(operatorAddress: string) {
    const isApprovedForAll = await this.mintContract.isApprovedForAll(
      this.refinable.accountAddress,
      operatorAddress
    );

    return isApprovedForAll;
  }

  async mint(
    nftValues: Omit<CreateItemInput, "supply" | "contractAddress" | "type">,
    royalty?: IRoyalty
  ): Promise<TransactionResponse> {
    if (!this._initialized) {
      throw Error("SDK_NOT_INITIALIZED");
    }

    this.verifyItem();

    // get royalty settings
    const royaltySettings = royalty ? royalty.serialize() : null;

    // API Call
    const { createItem } = await this.refinable.apiClient.request<
      CreateItemMutation,
      CreateItemMutationVariables
    >(CREATE_ITEM, {
      input: {
        description: nftValues.description,
        marketingDescription: nftValues.marketingDescription,
        name: nftValues.name,
        supply: 1,
        royaltySettings,
        tags: nftValues.tags,
        airdropAddresses: nftValues.airdropAddresses,
        file: nftValues.file,
        type: TOKEN_TYPE.ERC721,
        contractAddress: this.item.contractAddress,
        chainId: this.item.chainId,
      },
    });

    if (!createItem) {
      throw new Error("Couldn't create data object for NFT");
    }

    let { signature, item } = createItem;

    // update nft
    this.setItem(item);

    // Blockchain part
    if (!signature) {
      const approveMintSha3 = soliditySha3(
        this.item.contractAddress,
        item.tokenId,
        this.refinable.accountAddress
      );

      signature = await this.refinable.personalSign(approveMintSha3 as string);
    }

    const mintArgs = [
      item.tokenId,
      signature,
      royaltySettings?.shares
        ? royaltySettings.shares.map((share) => [share.recipient, share.value])
        : [],
      item.properties.ipfsDocument,
    ];

    // TODO: When V2 is deployed
    // if (royaltySettings) {
    //   mintArgs.push(
    //     royaltySettings.royaltyBps,
    //     royaltySettings.royaltyStrategy
    //   );
    // }

    const result: TransactionResponse = await this.mintContract.mint(
      ...mintArgs
    );

    // Wait for 1 confirmation
    await result.wait(this.refinable.options.waitConfirmations);

    await this.refinable.apiClient.request<
      FinishMintMutation,
      FinishMintMutationVariables
    >(FINISH_MINT, {
      input: {
        tokenId: item.tokenId,
        contractAddress: item.contractAddress,
        transactionHash: result.hash,
      },
    });

    return result;
  }

  cancelSale(): Promise<TransactionResponse> {
    if (!this.item.tokenId) {
      throw new Error("tokenId is not set");
    }

    if (!this.item.contractAddress) {
      throw new Error("contract address is not set");
    }

    this.verifyItem();
    return this.saleContract.cancel(
      this.item.contractAddress,
      this.item.tokenId //tokenId, // uint256 tokenId
    );
  }

  transfer(
    ownerEthAddress: string,
    recipientEthAddress: string
  ): Promise<TransactionResponse> {
    // the method is overloaded, generally this is the one we want to use
    return this.mintContract["safeTransferFrom(address,address,uint256)"](
      ownerEthAddress,
      recipientEthAddress,
      this.item.tokenId
    );
  }

  burn(): Promise<TransactionResponse> {
    return this.mintContract.burn(this.item.tokenId);
  }
}
