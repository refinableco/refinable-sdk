import { ethers } from "ethers";
import { Stream } from "form-data";
import {
  CreateMintOfferMutation,
  CreateMintOfferMutationVariables,
  LaunchpadDetailsInput,
  MintOfferFragment,
  OfferType,
  Price,
  PriceCurrency,
  UpdateMintOfferMutation,
  UpdateMintOfferMutationVariables,
} from "../@types/graphql";
import { CREATE_MINT_OFFER, UPDATE_MINT_OFFER } from "../graphql/sale";
import { ERCSaleID } from "../nft/ERCSaleId";
import { MintVoucher } from "../nft/interfaces/MintVoucher";
import { SaleVersion } from "../nft/interfaces/SaleInfo";
import { Chain } from "../refinable/Chain";
import { Erc721LazyMintContract } from "../refinable/contract/Erc721LazyMintContract";
import { Refinable } from "../refinable/Refinable";
import EvmSigner from "../refinable/signer/EvmSigner";
import EvmTransaction from "../transaction/EvmTransaction";
import { Transaction } from "../transaction/Transaction";
import { getUnixEpochTimeStampFromDateOr0 } from "../utils/time";
import { BasicOffer, PartialOffer } from "./Offer";

interface BuyParams {
  amount?: number;
  recipient?: string;
}

export interface PutForSaleParams {
  contractAddress: string;
  price: Price;
  startTime?: Date;
  endTime?: Date;
  launchpadDetails?: LaunchpadDetailsInput;
  supply: number;
  previewFile?: Stream | string;
  name?: string;
  description?: string;
  payee?: string;
}
export interface UpdateOfferParams {
  launchpadDetails?: LaunchpadDetailsInput;
  previewFile?: Stream | string;
  name?: string;
  description?: string;
}

export class MintOffer extends BasicOffer {
  private _chain: Chain;

  constructor(
    protected readonly refinable: Refinable,
    chainId: number,
    protected readonly offer?: PartialOffer & MintOfferFragment
  ) {
    super(refinable, offer);
    this._chain = new Chain(chainId);
  }

  get chainId() {
    return this._chain.chainId;
  }

  public async putForSale(params: PutForSaleParams): Promise<this> {
    const {
      price,
      startTime,
      endTime,
      launchpadDetails,
      contractAddress,
      supply,
      name,
      description,
      payee = this.refinable.accountAddress,
    } = params;

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

    // upload image if there is one
    let previewFile = params.previewFile;
    if (params.previewFile && typeof params.previewFile !== "string") {
      previewFile = await this.refinable.uploadFile(
        params.previewFile
      );
    }

    const contract = await this.getContract(contractAddress);

    const nonce = await contract.getNonce(this.refinable.accountAddress);

    const saleId = this.createSaleId(
      this.refinable.accountAddress,
      contractAddress
    );
    const blockchainId = new ERCSaleID(saleId, SaleVersion.V2).toBlockchainId();

    const signature = await this.createMintSignature({
      seller: this.refinable.accountAddress,
      nonce,
      signer: this.refinable.account as EvmSigner,
      contractAddress,
      chainId: this.chainId,
      message: {
        currency: price.currency,
        price: price.amount,
        startTime: getUnixEpochTimeStampFromDateOr0(startTime),
        endTime: getUnixEpochTimeStampFromDateOr0(endTime),
        supply,
        payee,
      },
    });

    const response = await this.refinable.graphqlClient.request<
      CreateMintOfferMutation,
      CreateMintOfferMutationVariables
    >(CREATE_MINT_OFFER, {
      input: {
        chainId: this.chainId,
        signature: signature.signature,
        type: OfferType.Mint,
        contractAddress,
        price: {
          currency: price.currency,
          amount: parseFloat(price.amount.toString()),
        },
        startTime,
        endTime,
        supply,
        launchpadDetails,
        blockchainId,
        previewFile: previewFile as string,
        name,
        description,
        payee,
      },
    });

    this._offer = response?.createMintOffer;
    return this;
  }

  public async updateOffer(params: UpdateOfferParams): Promise<this> {
    const { launchpadDetails, name, description } = params;

    // validate launchpad
    if (this._offer.startTime && launchpadDetails?.stages) {
      for (let i = 0; i < launchpadDetails.stages.length; i++) {
        const stage = launchpadDetails.stages[i];
        if (stage.startTime >= this._offer.startTime) {
          throw new Error(
            `The start time of the ${stage.stage} stage (index: ${i}) is after the start time of the public sale, this whitelist won't have any effect. Please remove this stage or adjust its startTime`
          );
        }
      }
    }

    // upload image if there is one
    let previewFile = params.previewFile;
    if (params.previewFile && typeof params.previewFile !== "string") {
      previewFile = await this.refinable.uploadFile(
        params.previewFile
      );
    }

    const response = await this.refinable.graphqlClient.request<
      UpdateMintOfferMutation,
      UpdateMintOfferMutationVariables
    >(UPDATE_MINT_OFFER, {
      id: this._offer.id,
      input: {
        launchpadDetails,
        previewFile: previewFile as string,
        name,
        description,
      },
    });

    this._offer = response?.updateMintOffer;
    return this;
  }

  public async buy(params: BuyParams = {}): Promise<Transaction> {
    const contract = await this.getContract();

    return contract.buy({
      ...params,
      mintVoucher: this.getMintVoucher(),
      price: this._offer.price,
      whitelistVoucher: this.whitelistVoucher,
      recipient: params.recipient || this.refinable.accountAddress,
    });
  }

  public async estimateGasBuy(params: BuyParams = {}) {
    const contract = await this.getContract();

    return contract.estimateGasBuy({
      ...params,
      mintVoucher: this.getMintVoucher(),
      price: this._offer.price,
      whitelistVoucher: this.whitelistVoucher,
      recipient: params.recipient || this.refinable.accountAddress,
    });
  }

  public async cancelSale(): Promise<EvmTransaction> {
    const contract = await this.getContract();

    return contract.endSale(this.seller?.ethAddress);
  }

  private getMintVoucher(): MintVoucher {
    const paymentToken = this._chain.getPaymentToken(this.offer.price.currency);

    const offerPrice = this._chain.parseCurrency(
      this.offer.price.currency,
      this.offer.price.amount
    );

    return {
      currency: paymentToken ?? "0x0000000000000000000000000000000000000000", //using the zero address means Ether
      price: offerPrice ?? "0",
      supply: this.offer.totalSupply.toString() ?? "0",
      payee: this.offer.payee,
      seller: this.offer.user?.ethAddress,
      startTime: getUnixEpochTimeStampFromDateOr0(this.offer.startTime),
      endTime: getUnixEpochTimeStampFromDateOr0(this.offer.endTime),
      recipient: "0x0000000000000000000000000000000000000000", // using the zero address means anyone can claim
      data: "0x",
      signature: this.offer.signature,
      marketConfigData: this.offer.marketConfig?.data ?? "0x",
      marketConfigDataSignature: this.offer.marketConfig?.signature ?? "0x",
    };
  }

  private async getContract(contractAddress?: string) {
    return this.refinable.evm.contracts.findAndConnectContract<Erc721LazyMintContract>(
      {
        contractAddress: contractAddress ?? this._offer.contractAddress,
        chainId: this.chainId,
      }
    );
  }

  private createSaleId(sellerAddress: string, contractAddress: string) {
    return ethers.utils.solidityKeccak256(
      ["address", "address"],
      [sellerAddress, contractAddress]
    );
  }

  private async createMintSignature({
    contractAddress,
    chainId,
    seller,
    nonce,
    message,
    signer,
  }: {
    nonce: number;
    contractAddress: string;
    seller: string;
    chainId: number;
    message: {
      currency: PriceCurrency;
      price: number;
      supply: number;
      startTime: number;
      endTime: number;
      data?: any[];
      payee: string;
    };
    signer: EvmSigner;
  }) {
    const paymentToken = this._chain.getPaymentToken(message.currency);
    const value = this._chain.parseCurrency(message.currency, message.price);

    const signedData = {
      EIP712Version: "4",
      domain: {
        name: "Refinable Mint",
        version: "1",
        chainId,
        verifyingContract: contractAddress,
      },
      types: {
        MintVoucher: [
          { name: "nonce", type: "uint256" },
          { name: "currency", type: "address" },
          { name: "price", type: "uint256" },
          { name: "supply", type: "uint256" },
          { name: "payee", type: "address" },
          { name: "seller", type: "address" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "data", type: "bytes" },
        ],
      },
      primaryType: "MintVoucher",
      message: {
        nonce: nonce,
        currency: paymentToken ?? "0x0000000000000000000000000000000000000000", //using the zero address means Ether
        price: value ?? "0",
        supply: message?.supply.toString() ?? "0",
        payee: message.payee,
        seller,
        startTime: message?.startTime ?? 0,
        endTime: message?.endTime ?? 0, // 1 year late
        recipient: "0x0000000000000000000000000000000000000000", // using the zero address means anyone can claim
        data: message?.data ?? [],
      },
    };

    const signature = await signer.signTypedData(
      signedData.domain,
      signedData.types,
      signedData.message
    );

    return { signedData, signature };
  }
}
