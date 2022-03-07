import { ethers } from "ethers";
import {
  ContractTypes,
  CreateOfferForEditionsMutation,
  CreateOfferForEditionsMutationVariables,
  OfferType,
  Price,
  TokenType,
} from "../@types/graphql";
import { CREATE_OFFER } from "../graphql/sale";
import { SaleOffer } from "../offer/SaleOffer";
import { RefinableEvmClient } from "../refinable/RefinableEvmClient";
import EvmTransaction from "../transaction/EvmTransaction";
import {
  getUnixEpochTimeStampFromDate,
  getUnixEpochTimeStampFromDateOr0,
} from "../utils/time";
import { optionalParam } from "../utils/utils";
import { AbstractEvmNFT } from "./AbstractEvmNFT";
import { PartialNFTItem } from "./AbstractNFT";
import { ERCSaleID, SaleVersion } from "./ERCSaleId";
import { SaleInfo } from "./interfaces/SaleInfo";

export class ERC1155NFT extends AbstractEvmNFT {
  constructor(refinable: RefinableEvmClient, item: PartialNFTItem) {
    super(TokenType.Erc1155, refinable, item);
  }

  async approve(operatorAddress: string): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    const setApprovalForAllTx = await nftTokenContract.setApprovalForAll(
      operatorAddress,
      true
    );

    return new EvmTransaction(setApprovalForAllTx);
  }

  async isApproved(operatorAddress: string): Promise<boolean> {
    const nftTokenContract = await this.getTokenContract();
    return nftTokenContract.isApprovedForAll(
      this.refinable.accountAddress,
      operatorAddress
    );
  }

  async buy(params: {
    signature: string;
    price: Price;
    ownerEthAddress: string;
    royaltyContractAddress?: string;
    supply: number;
    amount?: number;
    blockchainId: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<EvmTransaction> {
    return this._buy({
      royaltyContractAddress: params.royaltyContractAddress,
      price: params.price,
      ownerEthAddress: params.ownerEthAddress,
      signature: params.signature,
      endTime: params.endTime,
      startTime: params.startTime,
      blockchainId: params.blockchainId,
      supply: params.supply,
      amount: params.amount,
    });
  }

  async buyUsingVoucher(
    params: {
      signature: string;
      price: Price;
      ownerEthAddress: string;
      royaltyContractAddress?: string;
      supply: number;
      amount?: number;
      blockchainId: string;
      startTime?: Date;
      endTime?: Date;
    },
    voucher: any
  ): Promise<EvmTransaction> {
    return this._buy({
      royaltyContractAddress: params.royaltyContractAddress,
      price: params.price,
      ownerEthAddress: params.ownerEthAddress,
      signature: params.signature,
      endTime: params.endTime,
      startTime: params.startTime,
      blockchainId: params.blockchainId,
      supply: params.supply,
      amount: params.amount,
      voucher,
    });
  }

  async putForSale(params: {
    price: Price;
    startTime?: Date;
    endTime?: Date;
    supply?: number;
    launchpadDetails?: {
      vipStartDate?: Date;
      vipWhitelist?: string[];
      privateStartDate?: Date;
      privateWhitelist?: string[];
    };
  }): Promise<SaleOffer> {
    const {
      price,
      startTime = new Date(),
      endTime,
      launchpadDetails,
      supply = 1,
    } = params;

    this.verifyItem();

    const addressForApproval = this.transferProxyContract.address;

    await this.approveIfNeeded(addressForApproval);

    const saleParamHash = await this.getSaleParamsHash({
      price,
      ethAddress: this.refinable.accountAddress,
      supply,
      isV2: true,
    });

    const signedHash = await this.refinable.personalSign(
      saleParamHash as string
    );

    const saleId = await this.getSaleId();
    const blockchainId = new ERCSaleID(saleId, SaleVersion.V2).toBlockchainId();

    const result = await this.refinable.apiClient.request<
      CreateOfferForEditionsMutation,
      CreateOfferForEditionsMutationVariables
    >(CREATE_OFFER, {
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
        startTime,
        endTime,
        launchpadDetails,
        blockchainId,
      },
    });

    return this.refinable.createOffer<OfferType.Sale>(
      { ...result.createOfferForItems, type: OfferType.Sale },
      this
    );
  }

  async transfer(
    ownerEthAddress: string,
    recipientEthAddress: string,
    amount = 1
  ): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    const transferTx = await nftTokenContract.safeTransferFrom(
      ownerEthAddress,
      recipientEthAddress,
      this.item.tokenId,
      amount,
      ethers.constants.HashZero
    );

    return new EvmTransaction(transferTx);
  }

  async burn(amount: number, ownerEthAddress: string): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    const burnTx = await nftTokenContract.burn(
      ownerEthAddress,
      this.item.tokenId,
      amount
    );

    return new EvmTransaction(burnTx);
  }
}
