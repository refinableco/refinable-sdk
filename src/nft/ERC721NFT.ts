import {
  CreateOfferForEditionsMutation,
  CreateOfferForEditionsMutationVariables,
  LaunchpadDetailsInput,
  OfferType,
  Price,
  TokenType,
} from "../@types/graphql";
import { CREATE_OFFER } from "../graphql/sale";
import { SaleOffer } from "../offer/SaleOffer";
import { RefinableEvmClient } from "../refinable/RefinableEvmClient";
import EvmTransaction from "../transaction/EvmTransaction";
import { AbstractEvmNFT } from "./AbstractEvmNFT";
import { PartialNFTItem } from "./AbstractNFT";
import { ERCSaleID } from "./ERCSaleId";
import { SaleVersion } from "./interfaces/SaleInfo";

export class ERC721NFT extends AbstractEvmNFT {
  constructor(refinable: RefinableEvmClient, item: PartialNFTItem) {
    super(TokenType.Erc721, refinable, item);
  }

  async approve(operatorAddress: string): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    // TODO: we should actually use this but our contracts do not support it
    // return this.nftTokenContract.approve(operatorAddress, this.item.tokenId);
    const setApprovalForAllTx = await nftTokenContract.setApprovalForAll(
      operatorAddress,
      true
    );

    return new EvmTransaction(setApprovalForAllTx);
  }

  async isApproved(operatorAddress: string) {
    const nftTokenContract = await this.getTokenContract();

    // TODO: we should actually use this but our contracts do not support it
    // const approvedSpender = await this.nftTokenContract.getApproved(this.item.tokenId);
    const isApprovedForAll = await nftTokenContract.isApprovedForAll(
      this.refinable.accountAddress,
      operatorAddress
    );

    // return approvedSpender.toLowerCase() === operatorAddress.toLowerCase() || isApprovedForAll;
    return isApprovedForAll;
  }

  async buy(params: {
    signature: string;
    blockchainId: string;
    price: Price;
    ownerEthAddress: string;
    royaltyContractAddress?: string;
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
      supply: 1,
      amount: 1,
    });
  }

  async buyUsingVoucher(
    params: {
      signature: string;
      blockchainId: string;
      price: Price;
      ownerEthAddress: string;
      royaltyContractAddress?: string;
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
      supply: 1,
      amount: 1,
      voucher,
    });
  }

  async putForSale(params: {
    price: Price;
    startTime?: Date;
    endTime?: Date;
    launchpadDetails?: LaunchpadDetailsInput;
  }): Promise<SaleOffer> {
    const { price, startTime, endTime, launchpadDetails } = params;

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

    await this.approveIfNeeded(this.transferProxyContract.address);

    const saleParamsHash = await this.getSaleParamsHash({
      price,
      ethAddress: this.refinable.accountAddress,
      startTime,
      endTime,
      isV2: true,
    });

    const signedHash = await this.refinable.personalSign(
      saleParamsHash as string
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
        startTime,
        endTime,
        supply: 1,
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
    recipientEthAddress: string
  ): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    // the method is overloaded, generally this is the one we want to use
    const transferTx = await nftTokenContract[
      "safeTransferFrom(address,address,uint256)"
    ](ownerEthAddress, recipientEthAddress, this.item.tokenId);

    return new EvmTransaction(transferTx);
  }

  async burn(): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    const burnTx = await nftTokenContract.burn(this.item.tokenId);

    return new EvmTransaction(burnTx);
  }
}
