/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";
import { OfferType, TokenType } from "../@types/graphql";
import { Price } from "../constants/currency";
import { CREATE_OFFERS } from "../graphql/sale";
import { Refinable } from "../Refinable";
import { AbstractNFT, PartialNFTItem } from "./AbstractNFT";

export class ERC1155NFT extends AbstractNFT {
  constructor(refinable: Refinable, item: PartialNFTItem) {
    super(TokenType.Erc1155, refinable, item);
  }

  approve(operatorAddress: string): Promise<TransactionResponse> {
    return this.nftTokenContract.setApprovalForAll(operatorAddress, true);
  }

  isApproved(operatorAddress: string): Promise<boolean> {
    return this.nftTokenContract.isApprovedForAll(
      this.refinable.accountAddress,
      operatorAddress
    );
  }

  async putForSale(price: Price, supply = 1): Promise<string> {
    this.verifyItem();

    await this.approveIfNeeded(this.transferProxyContract.address);

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
        type: OfferType.Sale,
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
    return this.nftTokenContract.safeTransferFrom(
      ownerEthAddress,
      recipientEthAddress,
      this.item.tokenId,
      amount,
      ethers.constants.HashZero
    );
  }

  burn(amount = 1): Promise<TransactionResponse> {
    return this.nftTokenContract.burn(
      this.refinable.accountAddress,
      this.item.tokenId,
      amount
    );
  }
}
