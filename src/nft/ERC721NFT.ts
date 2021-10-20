/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { OfferType, TokenType } from "../@types/graphql";
import { Price } from "../constants/currency";
import { CREATE_OFFERS } from "../graphql/sale";
import { Refinable } from "../Refinable";
import { AbstractNFT, PartialNFTItem } from "./AbstractNFT";

export class ERC721NFT extends AbstractNFT {
  constructor(refinable: Refinable, item: PartialNFTItem) {
    super(TokenType.Erc721, refinable, item);
  }

  approve(operatorAddress: string): Promise<TransactionResponse> {
    // TODO: we should actually use this but our contracts do not support it
    // return this.nftTokenContract.approve(operatorAddress, this.item.tokenId);
    return this.nftTokenContract.setApprovalForAll(operatorAddress, true);
  }

  async isApproved(operatorAddress: string) {
    // TODO: we should actually use this but our contracts do not support it
    // const approvedSpender = await this.nftTokenContract.getApproved(this.item.tokenId);
    const isApprovedForAll = await this.nftTokenContract.isApprovedForAll(
      this.refinable.accountAddress,
      operatorAddress
    );

    // return approvedSpender.toLowerCase() === operatorAddress.toLowerCase() || isApprovedForAll;
    return isApprovedForAll;
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
        type: OfferType.Sale,
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
    return this.nftTokenContract["safeTransferFrom(address,address,uint256)"](
      ownerEthAddress,
      recipientEthAddress,
      this.item.tokenId
    );
  }

  burn(): Promise<TransactionResponse> {
    return this.nftTokenContract.burn(this.item.tokenId);
  }
}
