import {
  CreateOfferForEditionsMutation,
  CreateOfferForEditionsMutationVariables,
  LaunchpadDetailsInput,
  MarketConfig,
  OfferType,
  Price,
  TokenType,
} from "../@types/graphql";
import { CREATE_OFFER } from "../graphql/sale";
import { SaleOffer } from "../offer/SaleOffer";
import { Platform } from "../platform";
import { Refinable } from "../refinable/Refinable";
import EvmTransaction from "../transaction/EvmTransaction";
import { AbstractEvmNFT } from "./AbstractEvmNFT";
import { PartialNFTItem } from "./AbstractNFT";
import { ERCSaleID } from "./ERCSaleId";
import { SaleVersion } from "./interfaces/SaleInfo";
import {
  ListApproveStatus,
  ListStatus,
  LIST_STATUS_STEP,
  ListSignStatus,
  ListCreateStatus,
} from "./interfaces/SaleStatusStep";

export class ERC721NFT extends AbstractEvmNFT {
  constructor(refinable: Refinable, item: PartialNFTItem) {
    super(TokenType.Erc721, refinable, item);
  }

  async approve(operatorAddress: string): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContractWrapper();

    // FIXME: we should actually use this but our contracts do not support it
    // return this.nftTokenContract.approve(operatorAddress, this.item.tokenId);
    let setApprovalForAllTx;

    // for some custom contracts it fails to estimate the gas correctly
    try {
      setApprovalForAllTx = await nftTokenContract.contract.setApprovalForAll(
        operatorAddress,
        true
      );
    } catch (ex) {
      if (ex.code === "UNPREDICTABLE_GAS_LIMIT") {
        const gasLimit =
          await nftTokenContract.contract.estimateGas.setApprovalForAll(
            operatorAddress,
            true
          );

        const fee = await this.refinable.provider.getFeeData();

        setApprovalForAllTx = await nftTokenContract.contract.setApprovalForAll(
          operatorAddress,
          true,
          {
            gasLimit: gasLimit,
            gasPrice: fee.gasPrice,
          }
        );
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
    price: Price;
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
      price: Price;
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
    price: Price;
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
    const {
      price,
      startTime,
      endTime,
      launchpadDetails,
      platforms,
      onInitialize,
      onProgress,
      onError,
    } = params;

    // calculate steps
    const steps = [
      {
        step: LIST_STATUS_STEP.APPROVE,
        platform: Platform.REFINABLE,
      },
      {
        step: LIST_STATUS_STEP.SIGN,
        platform: Platform.REFINABLE,
      },
      {
        step: LIST_STATUS_STEP.CREATE,
        platform: Platform.REFINABLE,
      },
    ];
    onInitialize(steps);

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

    let saleParamsHash;
    try {
      await this.approveIfNeeded(this.transferProxyContract.address, () => {
        onProgress<ListApproveStatus>({
          step: LIST_STATUS_STEP.APPROVE,
          platform: Platform.REFINABLE,
          data: {
            addressToApprove: this.transferProxyContract.address,
          },
        });
      });

      saleParamsHash = await this.getSaleParamsHash({
        price,
        ethAddress: this.refinable.accountAddress,
        startTime,
        endTime,
        isV2: true,
      });
    } catch (ex) {
      onError(
        {
          step: LIST_STATUS_STEP.APPROVE,
          platform: Platform.REFINABLE,
        },
        ex.message
      );
      throw ex;
    }

    onProgress<ListSignStatus>({
      step: LIST_STATUS_STEP.SIGN,
      platform: Platform.REFINABLE,
      data: {
        what: "Sale Parameters",
        hash: saleParamsHash,
      },
    });

    let signedHash, saleId, blockchainId;

    try {
      signedHash = await this.refinable.account.sign(saleParamsHash as string);
      saleId = await this.getSaleId();
      blockchainId = new ERCSaleID(saleId, SaleVersion.V2).toBlockchainId();
    } catch (ex) {
      onError(
        {
          step: LIST_STATUS_STEP.SIGN,
          platform: Platform.REFINABLE,
        },
        ex.message
      );
      throw ex;
    }

    onProgress<ListCreateStatus>({
      step: LIST_STATUS_STEP.CREATE,
      platform: Platform.REFINABLE,
      data: {
        chainId: this.item.chainId,
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

    let result;
    try {
      result = await this.refinable.graphqlClient.request<
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
          startTime,
          endTime,
          supply: 1,
          launchpadDetails,
          blockchainId,
        },
      });
    } catch (ex) {
      onError(
        {
          step: LIST_STATUS_STEP.CREATE,
          platform: Platform.REFINABLE,
        },
        ex.message
      );
      throw ex;
    }

    return this.refinable.offer.createOffer<SaleOffer>(
      result.createOfferForItems,
      this
    );
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
