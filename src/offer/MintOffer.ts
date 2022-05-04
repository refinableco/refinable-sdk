import { BigNumber, Contract, ethers } from "ethers";
import { Stream } from "form-data";
import { RefinableEvmClient } from "..";
import {
  LaunchpadDetailsInput,
  Price,
  PurchaseMetadata,
  OfferType,
  PriceCurrency,
  CreateMintOfferMutation,
  CreateMintOfferMutationVariables,
  TokenType,
} from "../@types/graphql";
import { CREATE_MINT_OFFER } from "../graphql/sale";
import { ERCSaleID } from "../nft/ERCSaleId";
import { SaleVersion } from "../nft/interfaces/SaleInfo";
import { Chain } from "../refinable/Chain";
import { Transaction } from "../transaction/Transaction";
import { getUnixEpochTimeStampFromDateOr0 } from "../utils/time";
import { BasicOffer, PartialOffer } from "./Offer";

interface BuyParams {
  amount?: number;
}

export class MintOffer extends BasicOffer {
  _chain: Chain;

  constructor(
    protected readonly refinable: RefinableEvmClient,
    protected readonly chainId: number,
    protected readonly offer?: PartialOffer
  ) {
    super(refinable as any, offer);
    this._chain = new Chain(chainId);
  }

  public async putForSale(params: {
    contractAddress: string;
    price: Price;
    startTime?: Date;
    endTime?: Date;
    launchpadDetails?: LaunchpadDetailsInput;
    supply: number;
    previewImage?: Stream;
    name?: string;
    description?: string;
  }): Promise<this> {
    const {
      price,
      startTime,
      endTime,
      launchpadDetails,
      contractAddress,
      supply,
      name,
      description,
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
    let previewImage;
    if (params.previewImage) {
      previewImage = await this.refinable.uploadFile(params.previewImage);
    }

    const nonceResult: BigNumber = await this.nonceContract.getNonce(
      contractAddress,
      0,
      this.refinable.accountAddress
    );
    const saleId = this.createSaleId(
      this.refinable.accountAddress,
      contractAddress
    );
    const blockchainId = new ERCSaleID(saleId, SaleVersion.V2).toBlockchainId();
    const signature = await this.createMintSignature({
      nonce: 0,
      signer: this.refinable.provider,
      contractAddress,
      chainId: this.chainId,
      message: {
        currency: price.currency,
        price: price.amount,
        startTime: getUnixEpochTimeStampFromDateOr0(startTime),
        endTime: getUnixEpochTimeStampFromDateOr0(endTime),
        supply,
      },
    });

    const response = await this.refinable.apiClient.request<
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
        previewImage,
        name,
        description,
      },
    });

    this._offer = response?.createMintOffer;
    return this;
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
    nonce,
    message,
    signer,
  }: {
    nonce: number;
    contractAddress: string;
    chainId: number;
    message: {
      currency: PriceCurrency;
      price: number;
      supply: number;
      startTime: number;
      endTime: number;
      data?: any[];
    };
    signer: any;
  }) {
    const seller = signer.address;

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
        payee: signer.address,
        seller,
        startTime: message?.startTime ?? 0,
        endTime: message?.endTime ?? 0, // 1 year late
        recipient: "0x0000000000000000000000000000000000000000", // using the zero address means anyone can claim
        data: message?.data ?? [],
      },
    };

    const signature = await signer._signTypedData(
      signedData.domain,
      signedData.types,
      signedData.message
    );

    return { signedData, signature };
  }

  public async buy(params?: BuyParams, metadata?: PurchaseMetadata) {
    throw new Error("Not Implemented");
  }

  public async cancelSale<T extends Transaction = Transaction>(): Promise<T> {
    throw new Error("Not Implemented");
  }

  get nonceContract(): Contract {
    // right now there are no plans for 1155 lazy mint
    const saleNonceHolder = this.refinable.contracts.getBaseContract(
      this.chainId,
      `${TokenType.Erc721}_SALE_NONCE_HOLDER`
    );

    return saleNonceHolder.toEthersContract();
  }
}
