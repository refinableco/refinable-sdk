import { ethers } from "ethers";
import {
  CreateOfferForEditionsMutation,
  CreateOfferForEditionsMutationVariables,
  LaunchpadDetailsInput,
  MarketConfig,
  OfferType,
  Platform,
  Price,
  TokenType,
} from "../@types/graphql";
import { CREATE_OFFER } from "../graphql/sale";
import { SaleOffer } from "../offer/SaleOffer";
import { Refinable } from "../refinable/Refinable";
import EvmTransaction from "../transaction/EvmTransaction";
import { AbstractEvmNFT } from "./AbstractEvmNFT";
import { PartialNFTItem } from "./AbstractNFT";
import { ERCSaleID } from "./ERCSaleId";
import {
  CancelSaleStatus,
  CANCEL_SALE_STATUS_STEP,
} from "./interfaces/CancelSaleStatusStep";
import { SaleVersion } from "./interfaces/SaleInfo";
import { WhitelistVoucherParams } from "./interfaces/Voucher";
export class ERC1155NFT extends AbstractEvmNFT {
  constructor(refinable: Refinable, item: PartialNFTItem) {
    super(TokenType.Erc1155, refinable, item);
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
    price: Price;
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
      price: Price;
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
    price: Price;
    startTime?: Date;
    endTime?: Date;
    supply?: number;
    launchpadDetails?: LaunchpadDetailsInput;
  }): Promise<SaleOffer> {
    const { price, startTime, endTime, launchpadDetails, supply = 1 } = params;

    this.verifyItem();

    // validate launchpad
    if (startTime && launchpadDetails?.stages) {
      for (let i = 0; i < launchpadDetails.stages.length; i++) {
        const stage = launchpadDetails.stages[i];
        if (stage.startTime >= startTime) {
          throw new Error(
            `The start time of the ${stage.stage} stage (index: ${i}) is after the start time of the public sale, this whitelist won't have any effect. Please remove this stage or adjust its startTime`
          );
        }
      }
    }

    const addressForApproval = this.transferProxyContract.address;

    await this.approveIfNeeded(addressForApproval);

    const saleParamHash = await this.getSaleParamsHash({
      price,
      ethAddress: this.refinable.accountAddress,
      supply,
      startTime,
      endTime,
      isV2: true,
    });

    const signedHash = await this.refinable.account.sign(saleParamHash);

    const saleId = await this.getSaleId();
    const blockchainId = new ERCSaleID(saleId, SaleVersion.V2).toBlockchainId();

    const result = await this.refinable.graphqlClient.request<
      CreateOfferForEditionsMutation,
      CreateOfferForEditionsMutationVariables
    >(CREATE_OFFER, {
      input: {
        chainId: this.item.chainId,
        tokenId: this.item.tokenId,
        signature: signedHash,
        type: OfferType.Sale,
        contractAddress: this.item.contractAddress,
        price: {
          currency: price.currency,
          amount: parseFloat(price.amount.toString()),
        },
        supply,
        startTime,
        endTime,
        launchpadDetails,
        blockchainId,
      },
    });

    return this.refinable.offer.createOffer<SaleOffer>(
      result.createOfferForItems,
      this
    );
  }

  async cancelSaleOffers({
    onInitialize,
    onProgress,
  }: {
    onInitialize?: (
      steps: { step: CANCEL_SALE_STATUS_STEP; platform: Platform }[]
    ) => void;
    onProgress?: <T extends CancelSaleStatus>(status: T) => void;
    onError?: (
      { step, platform }: { step: CANCEL_SALE_STATUS_STEP; platform: Platform },
      error
    ) => void;
  }): Promise<void> {
    const steps = [
      {
        step: CANCEL_SALE_STATUS_STEP.SIGN,
        platform: Platform.Refinable,
      },
      {
        step: CANCEL_SALE_STATUS_STEP.CANCELING,
        platform: Platform.Refinable,
      },
      {
        step: CANCEL_SALE_STATUS_STEP.DONE,
        platform: Platform.Refinable,
      },
    ];

    onInitialize(steps);

    onProgress<CancelSaleStatus>({
      platform: Platform.Refinable,
      step: CANCEL_SALE_STATUS_STEP.SIGN,
    });

    await this.cancelSale(() => {
      onProgress<CancelSaleStatus>({
        platform: Platform.Refinable,
        step: CANCEL_SALE_STATUS_STEP.CANCELING,
      });
    });

    onProgress<CancelSaleStatus>({
      platform: Platform.Refinable,
      step: CANCEL_SALE_STATUS_STEP.DONE,
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
