/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { Contract } from "ethers";

import {
  erc1155SaleContract,
  erc115SaleAddress,
  transferProxyAddress,
} from "../contracts";
import { Price } from "../constants/currency";
import {
  erc1155SaleNonceHolderContract,
  erc1155TokenContract,
} from "../contracts";
import { Refinable } from "../Refinable";
import { AbstractNFT, PartialNFTItem } from "./AbstractNFT";
import { TOKEN_TYPE } from "./nft";

export class ERC1155NFT extends AbstractNFT {
  protected mintContract = erc1155TokenContract;
  protected nonceContract = erc1155SaleNonceHolderContract;
  private erc1155SaleContract: Contract;

  constructor(
    protected readonly refinable: Refinable,
    protected readonly item: PartialNFTItem
  ) {
    super(TOKEN_TYPE.ERC1155, refinable, item);

    this.erc1155SaleContract = erc1155SaleContract.connect(refinable.provider);
  }

  getSaleContractAddress(): string {
    return erc115SaleAddress;
  }

  async putForSale(price: Price, supply = 1): Promise<string> {
    this.verifyItem();

    const isApproved = await this.isApprovedForAll();
    if (!isApproved) {
      const approvalResult = await this.approveForAll(transferProxyAddress);

      // Wait for 1 confirmation
      await approvalResult.wait(this.refinable.waitConfirmations);
    }

    const saleParamHash = await this.getSaleParamsHash(
      price,
      this.refinable.account,
      supply
    );

    return await this.refinable.personalSign(saleParamHash as string);
  }

  async isApprovedForAll() {
    return this.getMintContractWithSigner().isApprovedForAll(
      this.refinable.account
    );
  }

  cancelSale(): Promise<TransactionResponse> {
    this.verifyItem();

    return this.erc1155SaleContract.cancel(
      this.item.contractAddress,
      this.item.tokenId //tokenId, // uint256 tokenId
    );
  }
}
