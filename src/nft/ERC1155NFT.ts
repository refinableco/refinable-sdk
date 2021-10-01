/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";

import { Price } from "../constants/currency";
import { Refinable } from "../Refinable";
import { AbstractNFT, NftValues, PartialNFTItem } from "./AbstractNFT";
import { TOKEN_TYPE } from "./nft";
import { IRoyalty } from "./royaltyStrategies/Royalty";
import { uploadFile } from "../graphql/utils";
import {
  CreateItemMutation,
  CreateItemMutationVariables,
  FinishMintMutation,
  FinishMintMutationVariables,
} from "../@types/graphql";
import { CREATE_ITEM, FINISH_MINT } from "../graphql/mint";
import { soliditySha3 } from "web3-utils";
import { CREATE_OFFERS } from "../graphql/sale";
import { ethers } from "ethers";

export class ERC1155NFT extends AbstractNFT {
  constructor(
    protected readonly refinable: Refinable,
    protected readonly item: PartialNFTItem
  ) {
    super(TOKEN_TYPE.ERC1155, refinable, item);
  }

  approve(operatorAddress: string): Promise<TransactionResponse> {
    return this.mintContract.setApprovalForAll(operatorAddress, true);
  }

  isApproved(operatorAddress: string): Promise<boolean> {
    return this.mintContract.isApprovedForAll(
      this.refinable.accountAddress,
      operatorAddress
    );
  }

  async mint(
    nftValues: NftValues,
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
      this.refinable.apiKey
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
        supply: nftValues.supply,
        royaltySettings,
        tags: nftValues.tags,
        airdropAddresses: nftValues.airdropAddresses,
        file: uploadedFileName as string,
        type: TOKEN_TYPE.ERC1155,
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
      item.supply.toString(),
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

  protected async approveIfNeeded(): Promise<TransactionResponse | null> {
    const isApproved = await this.isApprovedForAll();

    if (!isApproved) {
      const approvalResult = await this.approveForAll(
        this.transferProxyContract.address as string
      );

      // Wait for 1 confirmation
      await approvalResult.wait(this.refinable.options.waitConfirmations);

      return approvalResult;
    }
  }

  async putForSale(price: Price, supply = 1): Promise<string> {
    this.verifyItem();

    await this.approveIfNeeded();

    const saleParamHash = await this.getSaleParamsHash(
      price,
      this.refinable.accountAddress,
      supply
    );

    const signedHash = await this.refinable.personalSign(
      saleParamHash as string
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
        supply,
      },
    });

    return result;
  }

  async isApprovedForAll() {
    return this.mintContract.isApprovedForAll(
      this.refinable.accountAddress,
      this.transferProxyContract.address
    );
  }

  cancelSale(): Promise<TransactionResponse> {
    this.verifyItem();

    return this.saleContract.cancel(
      this.item.contractAddress,
      this.item.tokenId //tokenId, // uint256 tokenId
    );
  }

  transfer(
    ownerEthAddress: string,
    recipientEthAddress: string,
    amount = 1
  ): Promise<TransactionResponse> {
    return this.mintContract.safeTransferFrom(
      ownerEthAddress,
      recipientEthAddress,
      this.item.tokenId,
      amount,
      ethers.constants.HashZero
    );
  }

  burn(amount = 1): Promise<TransactionResponse> {
    console.log(this.refinable.accountAddress);

    return this.mintContract.burn(
      this.refinable.accountAddress,
      this.item.tokenId,
      amount
    );
  }
}
