/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Contract, ethers } from "ethers";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import {
  erc721SaleAddress,
  erc721SaleContract,
  erc721SaleNonceHolderContract,
  transferProxyAddress,
} from "../contracts";
import { Refinable } from "../Refinable";
import { AbstractNFT, PartialNFTItem } from "./AbstractNFT";
import { TOKEN_TYPE } from "./nft";
import { Price } from "../constants/currency";
import { erc721TokenContract } from "../contracts";

export class ERC721NFT extends AbstractNFT {
  protected nonceContract = erc721SaleNonceHolderContract;
  protected mintContract = erc721TokenContract;

  private erc721SaleContract: Contract;

  constructor(
    protected readonly refinable: Refinable,
    protected readonly item: PartialNFTItem
  ) {
    super(TOKEN_TYPE.ERC721, refinable, item);

    this.erc721SaleContract = erc721SaleContract.connect(refinable.provider);
  }
  async putForSale(price: Price): Promise<string> {
    this.verifyItem();

    const isApproved = await this.isApproved();

    if (!isApproved) {
      const approvalResult = await this.approve(
        transferProxyAddress,
        this.item.tokenId
      );

      // Wait for 1 confirmation
      await approvalResult.wait(this.refinable.waitConfirmations);
    }

    const saleParamsHash = await this.getSaleParamsHash(
      price,
      this.refinable.account
    );

    const signedHash = await this.refinable.personalSign(
      saleParamsHash as string
    );

    return signedHash;
  }

  async isApproved() {
    const approvedSpender = await this.getMintContractWithSigner().getApproved(
      this.item.tokenId
    );
    const isApprovedForAll =
      await this.getMintContractWithSigner().isApprovedForAll(
        this.refinable.account,
        transferProxyAddress
      );

    return (
      approvedSpender.toLowerCase() === this.refinable.account.toLowerCase() ||
      isApprovedForAll
    );
  }

  getSaleContractAddress(): string {
    return erc721SaleAddress;
  }

  cancelSale(): Promise<TransactionResponse> {
    this.verifyItem();

    return this.erc721SaleContract.cancel(
      this.item.contractAddress,
      this.item.tokenId //tokenId, // uint256 tokenId
    );
  }
}
