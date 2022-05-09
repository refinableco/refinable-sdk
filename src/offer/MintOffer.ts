import { BigNumber, Contract, ethers } from "ethers";
import { Stream } from "form-data";
import { RefinableEvmClient } from "..";
import {
  LaunchpadDetailsInput,
  Price,
  OfferType,
  PriceCurrency,
  CreateMintOfferMutation,
  CreateMintOfferMutationVariables,
  TokenType,
  MintOfferFragment,
} from "../@types/graphql";
import { CREATE_MINT_OFFER } from "../graphql/sale";
import { ERCSaleID } from "../nft/ERCSaleId";
import { SaleVersion } from "../nft/interfaces/SaleInfo";
import { Chain } from "../refinable/Chain";
import { RefinableBaseClient } from "../refinable/RefinableBaseClient";
import EvmTransaction from "../transaction/EvmTransaction";
import { Transaction } from "../transaction/Transaction";
import { getUnixEpochTimeStampFromDateOr0 } from "../utils/time";
import { optionalParam } from "../utils/utils";
import { BasicOffer, PartialOffer } from "./Offer";

interface BuyParams {
  amount?: number;
}

export class MintOffer extends BasicOffer {
  private _chain: Chain;
  private _contract: ethers.Contract;

  constructor(
    protected readonly refinable: RefinableBaseClient,
    protected readonly chainId: number,
    protected readonly offer?: PartialOffer & MintOfferFragment
  ) {
    super(refinable, offer);
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
      nonce: nonceResult.toNumber(),
      signer: (this.refinable as any).provider,
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

  public async buy(params: BuyParams): Promise<Transaction> {
    const contract = await this.getContract();

    const price = this._chain.parseCurrency(
      this._offer.price.currency,
      this._offer.price.amount
    );

    const priceWithServiceFee = await this._chain.getPriceWithBuyServiceFee(
      this._offer.price,
      this._offer.marketConfig.buyServiceFeeBps.value,
      params.amount ?? 1
    );

    const paymentToken = this._chain.getPaymentToken(
      this._offer.price.currency
    );
    const value = this._chain.parseCurrency(
      priceWithServiceFee.currency,
      priceWithServiceFee.amount
    );

    const nonceResult: BigNumber = await this.nonceContract.getNonce(
      this.offer.contract.contractAddress,
      0,
      this._offer.user?.ethAddress
    );

    const isNativeCurrency = this._chain.isNativeCurrency(
      priceWithServiceFee.currency
    );

    const message = {
      nonce: nonceResult.toString(),
      currency: paymentToken ?? "0x0000000000000000000000000000000000000000", //using the zero address means Ether
      price: price ?? "0",
      supply: this._offer.totalSupply.toString() ?? "0",
      payee: this._offer.user?.ethAddress,
      seller: this._offer.user?.ethAddress,
      startTime: getUnixEpochTimeStampFromDateOr0(this._offer.startTime),
      endTime: getUnixEpochTimeStampFromDateOr0(this._offer.endTime),
      recipient: "0x0000000000000000000000000000000000000000", // using the zero address means anyone can claim
      data: [],
    };

    const buyTx = await contract.claim(
      {
        ...message,
        signature: this._offer.signature,
        marketConfigData: this._offer.marketConfig?.data ?? "0x",
        marketConfigDataSignature: this._offer.marketConfig?.signature ?? "0x",
      },
      this.refinable.accountAddress,
      params.amount ?? 1,
      // If currency is Native, send msg.value
      ...optionalParam(isNativeCurrency, {
        value,
      })
    );

    return new EvmTransaction(buyTx);
  }

  /**
   * Singleton to get the corresponding lazy mint contract
   * @returns ethers.Contract
   */
  async getContract(): Promise<ethers.Contract> {
    if (!this.offer) {
      throw new Error("Offer was not set");
    }

    const contract = await (
      this.refinable as RefinableEvmClient
    ).contracts.findContract({
      contractAddress: this.offer.contract.contractAddress,
      chainId: this.chainId,
    });

    return contract.toEthersContract();
  }

  public async cancelSale<T extends Transaction = Transaction>(): Promise<T> {
    throw new Error("Not Implemented");
  }

  get nonceContract(): Contract {
    // right now there are no plans for 1155 lazy mint
    const saleNonceHolder = (
      this.refinable as RefinableEvmClient
    ).contracts.getBaseContract(
      this.chainId,
      `${TokenType.Erc721}_SALE_NONCE_HOLDER`
    );

    return saleNonceHolder.toEthersContract();
  }
}
