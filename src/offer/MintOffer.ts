import { TransactionResponse } from "@ethersproject/providers";
import { BigNumber, Contract, ethers } from "ethers";
import { Stream } from "form-data";
import { RefinableEvmClient } from "..";
import {
  CreateMintOfferMutation,
  CreateMintOfferMutationVariables,
  LaunchpadDetailsInput,
  MintOfferFragment,
  OfferType,
  Price,
  PriceCurrency,
  TokenType,
} from "../@types/graphql";
import { CREATE_MINT_OFFER } from "../graphql/sale";
import { ERCSaleID } from "../nft/ERCSaleId";
import { MintVoucher } from "../nft/interfaces/MintVoucher";
import { SaleVersion } from "../nft/interfaces/SaleInfo";
import { Chain } from "../refinable/Chain";
import { Refinable } from "../refinable/Refinable";
import EvmTransaction from "../transaction/EvmTransaction";
import { Transaction } from "../transaction/Transaction";
import { getUnixEpochTimeStampFromDateOr0 } from "../utils/time";
import { optionalParam } from "../utils/utils";
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
  previewImage?: Stream;
  name?: string;
  description?: string;
  payee?: string;
}

export class MintOffer extends BasicOffer {
  private _chain: Chain;
  private _contract: ethers.Contract;

  constructor(
    protected readonly refinable: Refinable,
    protected readonly refinableEvmClient: RefinableEvmClient,
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
        payee,
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
        payee,
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
      payee: string;
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
        payee: message.payee,
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

  public async buy(params: BuyParams = {}): Promise<Transaction> {
    const contract = await this.getContract();
    const amountToClaim = params.amount ?? 1;

    const price =
      this.whitelistVoucher?.price > 0
        ? this.whitelistVoucher?.price
        : this._offer.price.amount;
    const priceTimesAmount = price * amountToClaim;

    // Add allows as much as the price requests
    await this.refinableEvmClient.account.approveTokenContractAllowance(
      this._chain.getCurrency(this._offer.price.currency),
      priceTimesAmount,
      contract.address
    );

    const { method, args } = this.getBuyTxParams({
      recipient: params.recipient,
      amount: amountToClaim,
    });

    const claimTx: TransactionResponse = await contract[method](...args);

    return new EvmTransaction(claimTx);
  }

  public async estimateGasBuy(params: BuyParams = {}) {
    const contract = await this.getContract();

    const { method, args } = this.getBuyTxParams({
      recipient: params.recipient,
      amount: params.amount,
    });

    return await contract.estimateGas[method](...args);
  }

  private getBuyTxParams(params: { recipient?: string; amount?: number }) {
    const mintVoucher = this.getMintVoucher();
    const amount = params.amount ?? 1;
    const recipient = params.recipient ?? this.refinable.accountAddress;

    const price =
      this.whitelistVoucher?.price > 0
        ? this.whitelistVoucher?.price
        : this._offer.price.amount;
    const priceTimesAmount = price * amount;

    const parsedPrice = this._chain.parseCurrency(
      this._offer.price.currency,
      priceTimesAmount
    );

    const voucherPrice = this._chain.parseCurrency(
      this._offer.price.currency,
      this.whitelistVoucher?.price ?? 0
    );

    const isNativeCurrency = this._chain.isNativeCurrency(
      this._offer.price.currency
    );

    const args = [
      // LibMintVoucher.MintVoucher calldata mintVoucher
      mintVoucher,
      // address recipient
      recipient,
      // uint256 numberOfTokens
      amount,
      // WhitelistVoucherParams memory voucher - optional
      ...optionalParam(this.whitelistVoucher != null, {
        ...this.whitelistVoucher,
        price: voucherPrice,
      }),
      // If currency is Native, send msg.value
      ...optionalParam(isNativeCurrency, {
        value: parsedPrice,
      }),
    ];

    // Do we want to buy from a whitelist-enabled sale and do we have a voucher?
    const method = this.whitelistVoucher ? "claimWithVoucher" : "claim";

    return {
      args,
      method,
    };
  }

  public async getRemaining(recipient?: string): Promise<number> {
    const contract = await this.getContract();
    const remaining = await contract.getRemaining(
      recipient && recipient != "" ? recipient : this.refinable.accountAddress
    );

    return remaining.toNumber();
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

  /**
   * Singleton to get the corresponding lazy mint contract
   * @returns ethers.Contract
   */
  async getContract(): Promise<ethers.Contract> {
    if (!this.offer) {
      throw new Error("Offer was not set");
    }

    const contract = await this.refinableEvmClient.contracts.findContract({
      contractAddress: this.offer.contractAddress,
      chainId: this.chainId,
    });

    return contract.toEthersContract(this.refinable.provider);
  }

  public async cancelSale<T extends Transaction = Transaction>(): Promise<T> {
    throw new Error("Not Implemented");
  }

  get nonceContract(): Contract {
    // right now there are no plans for 1155 lazy mint
    const saleNonceHolder = this.refinableEvmClient.contracts.getBaseContract(
      this.chainId,
      `${TokenType.Erc721}_SALE_NONCE_HOLDER`
    );

    return saleNonceHolder.toEthersContract(this.refinable.provider);
  }
}
