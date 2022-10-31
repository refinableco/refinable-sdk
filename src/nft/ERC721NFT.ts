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

export class ERC721NFT extends AbstractEvmNFT {
  constructor(refinable: Refinable, item: PartialNFTItem) {
    super(TokenType.Erc721, refinable, item);
  }

  async getOwner(): Promise<string> {
    const nftTokenContract = await this.getTokenContractWrapper();
    return nftTokenContract.read.ownerOf(this._item.tokenId);
  }

  async approve(operatorAddress: string): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContractWrapper();

    // FIXME: we should actually use this but our contracts do not support it
    // return this.nftTokenContract.approve(operatorAddress, this.item.tokenId);
    let setApprovalForAllTx;

    // for some custom contracts it fails to estimate the gas correctly
    try {
      setApprovalForAllTx = await nftTokenContract.sendTransaction(
        "setApprovalForAll",
        [operatorAddress, true]
      );
    } catch (ex) {
      if (ex.code === "UNPREDICTABLE_GAS_LIMIT") {
        const gasLimit =
          await nftTokenContract.contract.estimateGas.setApprovalForAll(
            operatorAddress,
            true
          );

        const fee = await this.refinable.provider.getFeeData();

        setApprovalForAllTx = await nftTokenContract.sendTransaction(
          "setApprovalForAll",
          [operatorAddress, true],
          {
            gasLimit: gasLimit,
            gasPrice: fee.gasPrice,
          }
        );
      } else {
        throw ex;
      }
    }

    return new EvmTransaction(setApprovalForAllTx);
  }

  async isApproved(operatorAddress: string) {
    const nftTokenContract = await this.getTokenContractWrapper();

    // TODO: we should actually use this but our contracts do not support it
    // const approvedSpender = await this.nftTokenContract.getApproved(this.item.tokenId);
    const isApprovedForAll: boolean =
      await nftTokenContract.contract.isApprovedForAll(
        this.refinable.accountAddress,
        operatorAddress
      );

    // return approvedSpender.toLowerCase() === operatorAddress.toLowerCase() || isApprovedForAll;
    return isApprovedForAll;
  }

  async buy(params: {
    signature: string;
    blockchainId: string;
    price: IPrice;
    ownerEthAddress: string;
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
      supply: 1,
      amount: 1,
      marketConfig: params.marketConfig,
    });
  }

  async buyUsingVoucher(
    params: {
      signature: string;
      blockchainId: string;
      price: IPrice;
      ownerEthAddress: string;
      startTime?: Date;
      endTime?: Date;
      marketConfig?: MarketConfig;
    },
    voucher: any
  ): Promise<EvmTransaction> {
    return this._buy({
      price: params.price,
      ownerEthAddress: params.ownerEthAddress,
      signature: params.signature,
      endTime: params.endTime,
      startTime: params.startTime,
      blockchainId: params.blockchainId,
      supply: 1,
      amount: 1,
      voucher,
      marketConfig: params.marketConfig,
    });
  }

  async putForSale(params: {
    price: IPrice;
    startTime?: Date;
    endTime?: Date;
    launchpadDetails?: LaunchpadDetailsInput;
    platforms?: Platform[];
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
    const ownerEthAddress = await this.getOwner();

    if (
      ownerEthAddress.toLowerCase() !==
      this.refinable.accountAddress.toLowerCase()
    )
      throw new InsufficientBalanceError();

    return this._putForSale({
      price: params.price,
      startTime: params.startTime,
      endTime: params.endTime,
      launchpadDetails: params.launchpadDetails,
      onError: params.onError,
      onInitialize: params.onInitialize,
      onProgress: params.onProgress,
      platforms: params.platforms,
      supply: 1,
    });
  }

  async transfer(
    ownerEthAddress: string,
    recipientEthAddress: string
  ): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContractWrapper();

    return await nftTokenContract.sendTransaction(
      // the method is overloaded, generally this is the one we want to use
      "safeTransferFrom(address,address,uint256)",
      [ownerEthAddress, recipientEthAddress, this.item.tokenId]
    );
  }

  async burn(): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContractWrapper();

    return await nftTokenContract.sendTransaction("burn", [this.item.tokenId]);
  }
}
