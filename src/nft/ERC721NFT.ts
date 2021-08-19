/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Contract, ethers } from "ethers";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { transferProxyAddress } from "../contracts";
import { Refinable } from "../Refinable";
import { AbstractNFT, NftValues, PartialNFTItem } from "./AbstractNFT";
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
} from "../@types/graphql";
import { API_KEY } from "../constants";
import { uploadFile } from "../graphql/utils";
import { CREATE_OFFERS } from "../graphql/sale";

export class ERC721NFT extends AbstractNFT {
  constructor(
    protected readonly refinable: Refinable,
    protected readonly item: PartialNFTItem
  ) {
    super(TOKEN_TYPE.ERC721, refinable, item);
  }

  async putForSale(price: Price): Promise<string> {
    this.verifyItem();

    if (!this.item.tokenId) {
      throw new Error("tokenId is not set");
    }

    if (!this.item.contractAddress) {
      throw new Error("contract address is not set");
    }

    const isApproved = await this.isApproved();

    if (!isApproved) {
      const approvalResult = await this.approve(
        transferProxyAddress,
        this.item.tokenId
      );

      // Wait for 1 confirmation
      await approvalResult.wait(this.refinable._options.waitConfirmations);
    }

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

  async isApproved() {
    const approvedSpender = await this.mintContract.getApproved(
      this.item.tokenId
    );
    const isApprovedForAll = await this.mintContract.isApprovedForAll(
      this.refinable.accountAddress,
      transferProxyAddress
    );

    return (
      approvedSpender.toLowerCase() === transferProxyAddress.toLowerCase() ||
      isApprovedForAll
    );
  }

  async mint(
    nftValues: Omit<NftValues, "supply">,
    royalty?: IRoyalty
  ): Promise<TransactionResponse> {
    if (!this._initialized) {
      throw Error("SDK_NOT_INITIALIZED");
    }

    this.verifyItem();

    // get royalty settings
    const royaltySettings = royalty ? royalty.serialize() : null;

    // Upload image / video
    const { uploadFile: uploadedFileName } = await uploadFile(
      nftValues.file,
      API_KEY as string
    );

    if (!uploadedFileName) {
      throw new Error("Couldn't upload image for NFT");
    }

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
        file: uploadedFileName as string,
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
    await result.wait(1);

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
}
