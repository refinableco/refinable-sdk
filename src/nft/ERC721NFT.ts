import { Common } from "@refinableco/reservoir-sdk";
import { StrategyStandardSaleForFixedPrice } from "@refinableco/reservoir-sdk/dist/looks-rare/addresses";
import { BytesEmpty } from "@refinableco/reservoir-sdk/dist/utils";
import { parseEther } from "ethers/lib/utils";
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
import { PlatformFactory } from "../platform";
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
        const instance = platformFactory.createPlatform(platform);

        // -- LOOKSRARE
        // EX.
        // https://docs.looksrare.org/developers/maker-orders#breakdown-of-parameters
        // {
        //   "signature": "0xca048086170d030e223f36f21d329636dc163775ee4130c3f4d62cad8748bd5250cd0aacec582c73d0c53b555ae7661065ed9e16ff4fbfd5bb6e53688e4c807b1c",
        //   "tokenId": null,
        //   "collection": "0xA8Bf4A0993108454aBB4EBb4f5E3400AbB94282D",
        //   "strategy": "0x86F909F70813CdB1Bc733f4D97Dc6b03B8e7E8F3",
        //   "currency": "0xc778417E063141139Fce010982780140Aa0cD5Ab",
        //   "signer": "0x72c0e50be0f76863F708619784Ea4ff48D8587bE",
        //   "isOrderAsk": true,
        //   "nonce": "20",
        //   "amount": "1",
        //   "price": "10201020023",
        //   "startTime": "1645470906",
        //   "endTime": "1645471906",
        //   "minPercentageToAsk": 8500,
        //   "params": ""
        // }
        const now = Math.floor(Date.now() / 1000);
        await instance.listForSale(
          {
            tokenId: this._item.tokenId,
            collection: this._item.contractAddress,
            strategy: StrategyStandardSaleForFixedPrice[1],
            currency: Common.Addresses.Weth[1],
            signer: this.refinable.accountAddress,
            isOrderAsk: true, // side === "sell"
            nonce: "0",
            amount: "1",
            price: parseEther(price.amount.toString()).toString(),
            startTime: now,
            endTime: now + 86400 * 14, // 2-w validity
            params: BytesEmpty,
            minPercentageToAsk: 8500,
          },
          {
            onProgress,
          }
        );
      }
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
