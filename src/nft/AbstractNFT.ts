/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber, Contract, ethers } from "ethers";
import { soliditySha3, toWei } from "web3-utils";
import { getERC20Address, getERC20Contract } from "../contracts";
import { Refinable } from "../Refinable";
import { TOKEN_TYPE } from "./nft";
import { Price, REFINABLE_CURRENCY } from "../constants/currency";
import { optionalParam } from "../utils";
import { WAIT_CONFIRMATIONS } from "../constants";

export interface PartialNFTItem {
  contractAddress: string;
  tokenId: number;
}

export abstract class AbstractNFT {
  protected _item: PartialNFTItem;
  protected abstract mintContract: Contract;
  protected abstract nonceContract: Contract;

  constructor(
    protected type: TOKEN_TYPE,
    protected refinable: Refinable,
    protected item: PartialNFTItem
  ) {
    this._item = item;
  }

  public getItem() {
    return this.item;
  }

  public setItem(item: PartialNFTItem): void {
    this.item = item;
  }

  protected getMintContractWithSigner(): Contract {
    return this.mintContract.connect(this.refinable.provider);
  }
  protected getNonceContractWithSigner(): Contract {
    return this.nonceContract.connect(this.refinable.provider);
  }

  verifyItem() {
    if (!this.item) throw new Error("Unable to do this action, item required");
  }

  protected async getSaleParamsHash(
    price: Price,
    ethAddress?: string,
    supply?: number
  ) {
    const value = ethers.utils.parseEther(price.amount.toString()).toString();
    const paymentToken = getERC20Address(price.currency);

    const nonceResult: BigNumber =
      await this.getNonceContractWithSigner().getNonce(
        this.item.contractAddress,
        this.item.tokenId,
        ethAddress
      );

    const params = [
      this.item.contractAddress, // token
      this.item.tokenId, // tokenId
      // Remove the payment token when we pay in BNB. To keep supporting signatures before multi-currency support which are inherently BNB
      ...optionalParam(price.currency !== REFINABLE_CURRENCY.BNB, paymentToken),
      value, // values.price, // price
      ...optionalParam(
        supply != null,
        supply // selling
      ),
      nonceResult.toNumber(), // nonce
    ];

    const hash = soliditySha3(...(params as string[]));

    return hash;
  }

  protected async approveForTokenIfNeeded(
    price: Price,
    spenderAddress: string
  ): Promise<any> {
    if (price.currency !== REFINABLE_CURRENCY.BNB) {
      const erc20Contract = getERC20Contract(price.currency);

      if (erc20Contract) {
        const approvalResult: TransactionResponse = await erc20Contract
          .connect(this.refinable.provider)
          .approve(spenderAddress, toWei(price.amount.toString(), "ether"));

        // Wait for 1 confirmation
        await approvalResult.wait(WAIT_CONFIRMATIONS);
      }
    }

    return Promise.resolve();
  }

  protected approveForAll(address: string): Promise<TransactionResponse> {
    return this.getMintContractWithSigner().setApprovalForAll(address, true);
  }

  protected approve(
    address: string,
    tokenId: number
  ): Promise<TransactionResponse> {
    return this.getMintContractWithSigner().approve(address, tokenId);
  }

  abstract putForSale(price: Price): Promise<string>;

  abstract getSaleContractAddress(): string;
}
