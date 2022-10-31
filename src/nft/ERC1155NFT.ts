import { ethers } from "ethers";
import {
  LaunchpadDetailsInput,
  MarketConfig,
  Platform,
  TokenType,
} from "../@types/graphql";
import { InsufficientBalanceError } from "../errors/InsufficientBalanceError";
import { SaleOffer } from "../offer/SaleOffer";
import { Refinable } from "../refinable/Refinable";
import EvmTransaction from "../transaction/EvmTransaction";
import { AbstractEvmNFT } from "./AbstractEvmNFT";
import { PartialNFTItem } from "./AbstractNFT";
import { IPrice } from "./interfaces/Price";
import { ListStatus, LIST_STATUS_STEP } from "./interfaces/SaleStatusStep";
import { WhitelistVoucherParams } from "./interfaces/Voucher";

export class ERC1155NFT extends AbstractEvmNFT {
  constructor(refinable: Refinable, item: PartialNFTItem) {
    super(TokenType.Erc1155, refinable, item);
  }

  async getBalance(ownerAddress?: string): Promise<number> {
    const nftTokenContract = await this.getTokenContractWrapper();

    return (
      await nftTokenContract.read.balanceOf(
        ownerAddress ?? this.refinable.accountAddress,
        this.item.tokenId
      )
    )?.toNumber();
  }

  async approve(operatorAddress: string): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContractWrapper();

    return await nftTokenContract.sendTransaction("setApprovalForAll", [
      operatorAddress,
      true,
    ]);
  }

  async isApproved(operatorAddress: string): Promise<boolean> {
    const nftTokenContract = await this.getTokenContractWrapper();
    return nftTokenContract.contract.isApprovedForAll(
      this.refinable.accountAddress,
      operatorAddress
    );
  }

  async buy(params: {
    signature: string;
    price: IPrice;
    ownerEthAddress: string;
    supply: number;
    amount?: number;
    blockchainId: string;
    startTime?: Date;
    endTime?: Date;
    marketConfig?: MarketConfig;
  }): Promise<EvmTransaction> {
    return this._buy({
      price: params.price,
      ownerEthAddress: params.ownerEthAddress,
      signature: params.signature,
      endTime: params.endTime,
      startTime: params.startTime,
      blockchainId: params.blockchainId,
      supply: params.supply,
      amount: params.amount,
      marketConfig: params.marketConfig,
    });
  }

  async buyUsingVoucher(
    params: {
      signature: string;
      price: IPrice;
      ownerEthAddress: string;
      supply: number;
      amount?: number;
      blockchainId: string;
      startTime?: Date;
      endTime?: Date;
      marketConfig?: MarketConfig;
    },
    voucher: WhitelistVoucherParams & { startTime: Date }
  ): Promise<EvmTransaction> {
    return this._buy({
      price: params.price,
      ownerEthAddress: params.ownerEthAddress,
      signature: params.signature,
      endTime: params.endTime,
      startTime: params.startTime,
      blockchainId: params.blockchainId,
      supply: params.supply,
      amount: params.amount,
      voucher,
      marketConfig: params.marketConfig,
    });
  }

  async putForSale(params: {
    supply?: number;
    price: IPrice;
    startTime?: Date;
    endTime?: Date;
    launchpadDetails?: LaunchpadDetailsInput;
    onInitialize?: (
      steps: { step: LIST_STATUS_STEP; platform: Platform }[]
    ) => void;
    onProgress?: <T extends ListStatus>(status: T) => void;
    onError?: (
      { step, platform }: { step: LIST_STATUS_STEP; platform: Platform },
      error
    ) => void;
  }): Promise<SaleOffer> {
    // Check if current user has sufficient balance to put for sale
    const currentUserBalance = await this.getBalance();

    if (currentUserBalance < params.supply) throw new InsufficientBalanceError(currentUserBalance);

    return this._putForSale({
      price: params.price,
      startTime: params.startTime,
      endTime: params.endTime,
      launchpadDetails: params.launchpadDetails,
      onError: params.onError,
      onInitialize: params.onInitialize,
      onProgress: params.onProgress,
      platforms: [],
      supply: params.supply,
    });
  }

  async transfer(
    ownerEthAddress: string,
    recipientEthAddress: string,
    amount = 1
  ): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContractWrapper();

    return await nftTokenContract.sendTransaction("safeTransferFrom", [
      ownerEthAddress,
      recipientEthAddress,
      this.item.tokenId,
      amount,
      ethers.constants.HashZero,
    ]);
  }

  async burn(amount: number, ownerEthAddress: string): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContractWrapper();

    return await nftTokenContract.sendTransaction("burn", [
      ownerEthAddress,
      this.item.tokenId,
      amount,
    ]);
  }
}
