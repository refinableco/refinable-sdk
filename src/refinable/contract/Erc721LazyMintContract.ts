import { constants, ethers } from "ethers";
import { z } from "zod";
import { ContractTypes, Price } from "../../@types/graphql";
import { SaleSettings } from "../../interfaces/Contracts/Erc721Lazy";
import { LibPart } from "../../interfaces/LibPart";
import { ProviderSignerWallet } from "../../interfaces/Signer";
import { MintVoucher } from "../../nft/interfaces/MintVoucher";
import { WhitelistVoucherParams } from "../../nft/interfaces/Voucher";
import EvmTransaction from "../../transaction/EvmTransaction";
import { RefinableEvmOptions } from "../../types/RefinableOptions";
import { optionalParam } from "../../utils/utils";
import EvmAccount from "../account/EvmAccount";
import { Contract, IContract } from "./Contract";

interface BuyParams {
  mintVoucher: MintVoucher;
  price: Price;
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

  constructor(contract: IContract, evmOptions: RefinableEvmOptions) {
    super(contract, evmOptions);
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

  maxTokens(): Promise<number> {
    return this.contractWrapper.contract.MAX_TOKENS();
  }

  isRevealed(): Promise<boolean> {
    return this.contractWrapper.contract._revealed();
  }

  getSaleSettings(): Promise<SaleSettings> {
    return this.contractWrapper.contract.saleSettings();
  }

  updateSaleSettings(saleSettings: Partial<SaleSettings>) {
    const settings: SaleSettings = {
      maxPerMint: 0,
      maxPerWallet: 0,
      walletLimitBypassAddress: ethers.constants.AddressZero,
      ...saleSettings,
    };
    return this.contractWrapper.sendTransaction("updateParams", [settings]);
  }

  setRoyaltyInfo(royalties: LibPart[]) {
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
      this.chain.getCurrency(params.price.currency),
      priceTimesAmount,
      this.contractAddress
    );

    const { method, args, callOverrides } = this.getBuyTxParams({
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

    const { method, args, callOverrides } = this.getBuyTxParams({
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

  private getBuyTxParams(params: {
    mintVoucher: MintVoucher;
    recipient: string;
    price: Price;
    amount?: number;
    whitelistVoucher?: WhitelistVoucherParams;
  }) {
    const amount = params.amount ?? 1;

    const price =
      params.whitelistVoucher?.price > 0
        ? params.whitelistVoucher?.price
        : params.price.amount;
    const priceTimesAmount = price * amount;

    const parsedPrice = this.chain.parseCurrency(
      params.price.currency,
      priceTimesAmount
    );

    const voucherPrice = this.chain.parseCurrency(
      params.price.currency,
      params.whitelistVoucher?.price ?? 0
    );

    const isNativeCurrency = this.chain.isNativeCurrency(params.price.currency);

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
      callOverrides: isNativeCurrency
        ? {
            value: parsedPrice,
          }
        : undefined,
    };
  }
}
