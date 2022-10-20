import {
  CreateOfferForEditionsMutation,
  CreateOfferForEditionsMutationVariables,
  LaunchpadDetailsInput,
  MarketConfig,
  OfferType,
  Platform,
  Price,
  TokenType,
  SaleOffer as SaleOfferType,
} from "../@types/graphql";
import { CREATE_OFFER } from "../graphql/sale";
import { SaleOffer } from "../offer/SaleOffer";
import { PlatformFactory } from "../platform";
import { Refinable } from "../refinable/Refinable";
import EvmTransaction from "../transaction/EvmTransaction";
import { AbstractEvmNFT } from "./AbstractEvmNFT";
import { PartialNFTItem } from "./AbstractNFT";
import { ERCSaleID } from "./ERCSaleId";
import {
  CancelSaleSignStatus,
  CancelSaleStatus,
  CANCEL_SALE_STATUS_STEP,
} from "./interfaces/CancelSaleStatusStep";
import { SaleVersion } from "./interfaces/SaleInfo";
import {
  ListApproveStatus,
  ListStatus,
  LIST_STATUS_STEP,
  ListSignStatus,
  ListCreateStatus,
  ListDoneStatus,
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
      platforms = [],
      onInitialize = () => true,
      onProgress = () => true,
      onError = () => true,
    } = params;

    // calculate steps
    const steps = [
      {
        step: LIST_STATUS_STEP.APPROVE,
        platform: Platform.Refinable,
      },
      {
        step: LIST_STATUS_STEP.SIGN,
        platform: Platform.Refinable,
      },
      {
        step: LIST_STATUS_STEP.CREATE,
        platform: Platform.Refinable,
      },
    ];

    if (Array.isArray(platforms)) {
      for (const platform of platforms) {
        steps.push(
          {
            step: LIST_STATUS_STEP.APPROVE,
            platform,
          },
          {
            step: LIST_STATUS_STEP.SIGN,
            platform,
          },
          {
            step: LIST_STATUS_STEP.CREATE,
            platform,
          }
        );
      }
    }

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
          platform: Platform.Refinable,
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
          platform: Platform.Refinable,
        },
        ex
      );
      throw ex;
    }

    onProgress<ListSignStatus>({
      step: LIST_STATUS_STEP.SIGN,
      platform: Platform.Refinable,
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
          platform: Platform.Refinable,
        },
        ex
      );
      throw ex;
    }

    onProgress<ListCreateStatus>({
      step: LIST_STATUS_STEP.CREATE,
      platform: Platform.Refinable,
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
          platform: Platform.Refinable,
        },
        ex
      );
      throw ex;
    }

    onProgress<ListDoneStatus>({
      step: LIST_STATUS_STEP.DONE,
      platform: Platform.Refinable,
      data: result,
    });

    // third party platforms
    if (Array.isArray(platforms)) {
      const platformFactory = new PlatformFactory(this.refinable);
      for (const platform of platforms) {
        const platformInstance = platformFactory.createPlatform(platform);
        await platformInstance.listForSale(this, price, {
          onProgress,
        });
      }
    }

    return this.refinable.offer.createOffer<SaleOffer>(
      result.createOfferForItems,
      this
    );
  }

  async cancelSaleOffers({
    offers,
    onInitialize,
    onProgress,
    onError,
  }: {
    offers?: SaleOfferType[];
    onInitialize?: (
      steps: { step: CANCEL_SALE_STATUS_STEP; platform: Platform }[]
    ) => void;
    onProgress?: <T extends CancelSaleStatus>(status: T) => void;
    onError?: (
      { step, platform }: { step: CANCEL_SALE_STATUS_STEP; platform: Platform },
      error
    ) => void;
  }): Promise<void> {
    const platformFactory = new PlatformFactory(this.refinable);

    const steps = [];

    for (const offer of offers) {
      if (offer.platform === Platform.Refinable) {
        steps.push(
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
          }
        );
      } else {
        steps.push(
          {
            step: CANCEL_SALE_STATUS_STEP.SIGN,
            platform: offer.platform,
          },
          {
            step: CANCEL_SALE_STATUS_STEP.CANCELING,
            platform: offer.platform,
          },
          {
            step: CANCEL_SALE_STATUS_STEP.DONE,
            platform: offer.platform,
          }
        );
      }
    }

    onInitialize(steps);

    this.verifyItem();

    for (const offer of offers) {
      if (offer.platform === Platform.Refinable) {
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
      } else {
        const externalPlatform = platformFactory.createPlatform(offer.platform);
        await externalPlatform.cancelSale(offer, {
          onProgress,
          onError,
        });
      }
    }
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
