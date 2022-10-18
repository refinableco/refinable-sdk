import { constants, ethers } from "ethers";
import { z } from "zod";
import { ContractTypes, Price, PriceInput } from "../../@types/graphql";
import { SaleSettings } from "../../interfaces/Contracts/Erc721Lazy";
import { LibPart } from "../../interfaces/LibPart";
import { ProviderSignerWallet } from "../../interfaces/Signer";
import { MintVoucher } from "../../nft/interfaces/MintVoucher";
import { WhitelistVoucherParams } from "../../nft/interfaces/Voucher";
import EvmTransaction from "../../transaction/EvmTransaction";
import { RefinableEvmOptions } from "../../types/RefinableOptions";
import { optionalParam } from "../../utils/utils";
import EvmAccount from "../account/EvmAccount";
import { Refinable } from "../Refinable";
import { Contract, IContract } from "./Contract";

interface BuyParams {
  mintVoucher: MintVoucher;
  price: PriceInput;
  amount?: number;
  recipient: string;
  whitelistVoucher?: WhitelistVoucherParams;
}

export class Erc721LazyMintContract extends Contract {
  static type = ContractTypes.Erc721LazyMintToken as const;
  static deployArgsSchema = z.object({
    name: z.string().min(1),
    symbol: z.string().min(1),
    placeholderTokenURI: z.string().min(1),
    tokenMintLimit: z.number().positive(),
    saleSettings: z
      .object({
        maxPerMint: z.number().default(0),
        maxPerWallet: z.number().default(0),
        walletLimitBypassAddress: z.string().default(constants.AddressZero),
      })
      .optional()
      .default({
        maxPerMint: 0,
        maxPerWallet: 0,
        walletLimitBypassAddress: constants.AddressZero,
      }),
    royalties: z
      .object({
        account: z.string().default(constants.AddressZero),
        value: z.number().default(0),
      })
      .optional()
      .default({ account: constants.AddressZero, value: 0 }),
  });
  private account: EvmAccount;

  constructor(
    refinable: Refinable,
    contract: IContract,
    evmOptions: RefinableEvmOptions
  ) {
    super(refinable, contract, evmOptions);
  }

  connect(signerOrProvider: ProviderSignerWallet) {
    super.connect(signerOrProvider);

    this.account = new EvmAccount(signerOrProvider, this.evmOptions);

    return this;
  }

  async getRemaining(recipient: string): Promise<number> {
    const response = await this.contractWrapper.contract.getRemaining(
      recipient
    );

    return response.toNumber();
  }

  async maxTokens(): Promise<number> {
    const maxTokens = await this.contractWrapper.read.MAX_TOKENS();

    return maxTokens.toNumber();
  }

  async totalSupply(): Promise<number> {
    const totalSupply = await this.contractWrapper.read.totalSupply();

    return totalSupply.toNumber();
  }

  isRevealed(): Promise<boolean> {
    return this.contractWrapper.read._revealed();
  }

  async getSaleSettings(): Promise<SaleSettings> {
    const settings = await this.contractWrapper.read.saleSettings();

    return {
      ...settings,
      maxPerMint: settings.maxPerMint.toNumber(),
      maxPerWallet: settings.maxPerWallet.toNumber(),
    };
  }

  async getNonce(seller: string): Promise<number> {
    return (await this.contractWrapper.read.getNonce(seller))?.toNumber();
  }

  // **** TX ****

  updateSaleSettings(saleSettings: Partial<SaleSettings>) {
    const settings: SaleSettings = {
      maxPerMint: 0,
      maxPerWallet: 0,
      walletLimitBypassAddress: ethers.constants.AddressZero,
      ...saleSettings,
    };
    return this.contractWrapper.sendTransaction("updateParams", [settings]);
  }

  setRoyaltyInfo(royalties: LibPart) {
    return this.contractWrapper.sendTransaction("setRoyaltyInfo", [royalties]);
  }

  toggleReveal(updatedURI: string) {
    return this.contractWrapper.sendTransaction("toggleReveal", [updatedURI]);
  }

  batchAirdrop(recipientAmount: { amount: number; recipient: string }[]) {
    const numberOfTokens = recipientAmount.map(({ amount }) => amount);
    const recipients = recipientAmount.map(({ recipient }) => recipient);

    return this.contractWrapper.sendTransaction("batchAirdrop", [
      numberOfTokens,
      recipients,
    ]);
  }

  endSale(seller: string) {
    return this.contractWrapper.sendTransaction("invalidateVoucher", [seller]);
  }

  public async buy(params: BuyParams): Promise<EvmTransaction> {
    const amountToClaim = params.amount ?? 1;

    const actualPrice =
      params.whitelistVoucher?.price > 0
        ? params.whitelistVoucher?.price
        : params.price.amount;
    const priceTimesAmount = actualPrice * amountToClaim;

    // Add allows as much as the price requests
    await this.account.approveTokenContractAllowance(
      await this.chain.getCurrency(params.price.currency),
      priceTimesAmount,
      this.contractAddress
    );

    const { method, args, callOverrides } = await this.getBuyTxParams({
      recipient: params.recipient,
      amount: amountToClaim,
      price: params.price,
      mintVoucher: params.mintVoucher,
      whitelistVoucher: params.whitelistVoucher,
    });

    const response = await this.contractWrapper.sendTransaction(
      method,
      args,
      callOverrides
    );

    return response;
  }

  public async estimateGasBuy(params: BuyParams) {
    const amountToClaim = params.amount ?? 1;

    const { method, args, callOverrides } = await this.getBuyTxParams({
      recipient: params.recipient,
      amount: amountToClaim,
      price: params.price,
      mintVoucher: params.mintVoucher,
      whitelistVoucher: params.whitelistVoucher,
    });

    // If callOverrides set, append to args
    if (callOverrides) {
      args.push(callOverrides);
    }

    return await this.contractWrapper.contract.estimateGas[method](...args);
  }

  private async getBuyTxParams(params: {
    mintVoucher: MintVoucher;
    recipient: string;
    price: PriceInput;
    amount?: number;
    whitelistVoucher?: WhitelistVoucherParams;
  }) {
    const amount = params.amount ?? 1;

    const price =
      params.whitelistVoucher?.price > 0
        ? params.whitelistVoucher?.price
        : params.price.amount;
    const priceTimesAmount = price * amount;

    const coin = await this.chain.getCoin({
      id: params.price.currency,
    });

    const parsedPrice = this.chain.parseUnits(
      coin.contract.decimals,
      priceTimesAmount
    );

    const voucherPrice = this.chain.parseUnits(
      coin.contract.decimals,
      params.whitelistVoucher?.price ?? 0
    );

    const args: unknown[] = [
      // LibMintVoucher.MintVoucher calldata mintVoucher
      params.mintVoucher,
      // address recipient
      params.recipient,
      // uint256 numberOfTokens
      amount,
      // WhitelistVoucherParams memory voucher - optional
      ...optionalParam(params.whitelistVoucher != null, {
        ...params.whitelistVoucher,
        price: voucherPrice,
      }),
    ];

    // Do we want to buy from a whitelist-enabled sale and do we have a voucher?
    const method = params.whitelistVoucher ? "claimWithVoucher" : "claim";

    return {
      args,
      method,
      callOverrides: coin.contract.isNative
        ? {
            value: parsedPrice,
          }
        : undefined,
    };
  }
}
