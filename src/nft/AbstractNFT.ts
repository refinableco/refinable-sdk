/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber, Contract, ethers } from "ethers";
import { soliditySha3, toWei } from "web3-utils";
import { getERC20Address, getERC20Contract } from "../contracts";
import { ContractType, Refinable } from "../Refinable";
import { TOKEN_TYPE } from "./nft";
import { Price, REFINABLE_CURRENCY } from "../constants/currency";
import { optionalParam } from "../utils";
import { IRoyalty } from "./royaltyStrategies/Royalty";
import { CreateItemInput } from "../@types/graphql";
import { ReadStream } from "fs";

export interface PartialNFTItem {
  contractAddress: string;
  chainId: number;
  tokenId?: number;
}

export interface NftValues
  extends Omit<CreateItemInput, "file" | "contractAddress" | "type"> {
  file: ReadStream;
}

export abstract class AbstractNFT {
  protected _types: ContractType[] = [];
  protected _initialized: boolean = false;
  protected _item: PartialNFTItem;

  protected saleContract: Contract;
  protected mintContract: Contract;
  protected nonceContract: Contract;
  protected transferProxyContract: Contract;

  constructor(
    protected type: TOKEN_TYPE,
    protected refinable: Refinable,
    protected item: PartialNFTItem
  ) {
    this._item = item;
    this._types = [
      `${type}_TOKEN`,
      `${type}_SALE`,
      `${type}_SALE_NONCE_HOLDER`,
      "TRANSFER_PROXY",
    ];
  }

  public async build(): Promise<this> {
    const { refinableContracts } = await this.refinable.getContracts(
      this._types
    );

    const refinableContractsMap = refinableContracts.reduce(
      (prev: any, contract: any) => ({ ...prev, [contract.type]: contract }),
      {}
    );

    // Token contract
    this.mintContract = new ethers.Contract(
      refinableContractsMap[`${this.type}_TOKEN`].contractAddress,
      refinableContractsMap[`${this.type}_TOKEN`].contractABI
    ).connect(this.refinable.provider);

    // Sale contract
    this.saleContract = new ethers.Contract(
      refinableContractsMap[`${this.type}_SALE`].contractAddress,
      refinableContractsMap[`${this.type}_SALE`].contractABI
    ).connect(this.refinable.provider);

    // Nonce contract
    this.nonceContract = new ethers.Contract(
      refinableContractsMap[`${this.type}_SALE_NONCE_HOLDER`].contractAddress,
      refinableContractsMap[`${this.type}_SALE_NONCE_HOLDER`].contractABI
    ).connect(this.refinable.provider);

    // transfer proxy
    this.transferProxyContract = new ethers.Contract(
      refinableContractsMap["TRANSFER_PROXY"].contractAddress,
      refinableContractsMap["TRANSFER_PROXY"].contractABI
    ).connect(this.refinable.provider);

    this._initialized = true;

    return this;
  }

  public getItem() {
    return this.item;
  }

  public setItem(item: PartialNFTItem): void {
    this.item = item;
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

    const nonceResult: BigNumber = await this.nonceContract.getNonce(
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
        await approvalResult.wait(this.refinable.options.waitConfirmations);
      }
    }

    return Promise.resolve();
  }

  protected approveForAll(address: string): Promise<TransactionResponse> {
    return this.mintContract.setApprovalForAll(address, true);
  }

  protected approve(
    address: string,
    tokenId: number
  ): Promise<TransactionResponse> {
    return this.mintContract.approve(address, tokenId);
  }

  abstract mint(
    nftValues: NftValues,
    royalty?: IRoyalty
  ): Promise<TransactionResponse>;

  abstract putForSale(price: Price): Promise<string>;

  abstract transfer(
    ownerEthAddress: string,
    recipientEthAddress: string
  ): Promise<TransactionResponse>;
}
