import {
  BigNumber,
  CallOverrides,
  Contract,
  Contract as EthersContract,
  ContractTransaction,
  ethers,
  providers,
} from "ethers";
import merge from "lodash/merge";
import { TransactionError } from "../../errors/TransactionError";
import { Chain } from "../../interfaces/Network";
import { ProviderSignerWallet } from "../../interfaces/Signer";
import EvmTransaction from "../../transaction/EvmTransaction";
import { RefinableEvmOptions } from "../../types/RefinableOptions";
import { getPolygonGasPriorityFee } from "../../utils/gas";
import { getSignerAndProvider } from "../../utils/singer";
import * as Sentry from "@sentry/node";

export interface IContractWrapper {
  address: string;
  abi: ethers.ContractInterface;
}

export interface ContractWrapperSettings {
  gasSettings: {
    maxPriceInGwei: number; // Maximum gas price for transactions (default 300 gwei)
    speed: "standard" | "fast" | "fastest"; // the tx speed setting: 'standard'|'fast|'fastest' (default: 'fastest')
  };
}

export class ContractWrapper implements IContractWrapper {
  address: string;
  abi: ethers.ContractInterface;

  public contract: Contract;

  private isValidContract = false;

  protected provider: providers.Provider;
  protected signer: ethers.Signer;
  protected options: RefinableEvmOptions = {
    gasSettings: {
      maxPriceInGwei: 300, // Maximum gas price for transactions (default 300 gwei)
      speed: "fastest", // the tx speed setting: 'standard'|'fast|'fastest' (default: 'fastest')
    },
  };

  constructor(
    contract: IContractWrapper,
    providerOrSigner: ProviderSignerWallet,
    options?: RefinableEvmOptions
  ) {
    Object.assign(this, contract);

    const [signer, provider] = getSignerAndProvider(providerOrSigner);

    this.provider = provider;
    this.signer = signer;

    this.contract = this.toEthersContract(signer);

    this.options = merge(this.options, options);
  }

  private toEthersContract(
    providerOrSigner?: ethers.Signer | providers.Provider
  ) {
    return new EthersContract(
      this.address,
      this.abi,
      providerOrSigner ?? this.signer
    );
  }

  public async sendTransaction(
    method: string,
    args: any[],
    callOverrides: CallOverrides = {}
  ): Promise<EvmTransaction> {
    // one time verification that this is a valid contract (to avoid sending funds to wrong addresses)
    if (!this.isValidContract) {
      const code = await this.provider.getCode(this.address);
      this.isValidContract = code !== "0x";
      if (!this.isValidContract) {
        throw new Error(
          "The address you're trying to send a transaction to is not a smart contract. Make sure you are on the correct network and the contract address is correct"
        );
      }
    }

    // Override callOverrides if no gas fee is defined
    if (
      !Object.keys(callOverrides).find((key) =>
        ["maxFeePerGas", "maxPriorityFeePerGas", "gasPrice"].includes(key)
      )
    ) {
      callOverrides = {
        ...(await this.getCallOverrides()),
        ...callOverrides,
      };
    }

    const tx = await this.sendTransactionByFunction(
      method,
      args,
      callOverrides
    );

    const receipt = await tx.wait();

    return new EvmTransaction(receipt, this.provider);
  }

  /**
   * @internal
   */
  async sendTransactionByFunction(
    method: string,
    args: any[],
    callOverrides: CallOverrides
  ): Promise<ContractTransaction> {
    this.contract;
    const func: ethers.ContractFunction = (this.contract.functions as any)[
      method
    ];
    if (!func) {
      throw new Error(`invalid function: "${method.toString()}"`);
    }
    try {
      return await func(...args, callOverrides);
    } catch (e) {
      Sentry.captureException(e);
      throw new TransactionError(e, this.contract.interface);
    }
  }

  public async getCallOverrides(): Promise<CallOverrides> {
    if (typeof window !== "undefined") {
      // When running in the browser, let the wallet suggest gas estimates
      // this means that the gas speed preferences set in the SDK options are ignored in a browser context
      // but it also allows users to select their own gas speed prefs per tx from their wallet directly
      return {};
    }
    const feeData = await this.provider.getFeeData();
    const supports1559 = feeData.maxFeePerGas && feeData.maxPriorityFeePerGas;
    if (supports1559) {
      const chainId = (await this.provider.getNetwork()).chainId;
      const block = await this.provider.getBlock("latest");
      const baseBlockFee =
        block && block.baseFeePerGas
          ? block.baseFeePerGas
          : ethers.utils.parseUnits("1", "gwei");
      let defaultPriorityFee: BigNumber;
      if (
        chainId === Chain.PolygonTestnet ||
        chainId === Chain.PolygonMainnet
      ) {
        // for polygon, get fee data from gas station
        defaultPriorityFee = await getPolygonGasPriorityFee(chainId);
      } else {
        // otherwise get it from ethers
        defaultPriorityFee = BigNumber.from(feeData.maxPriorityFeePerGas);
      }
      // then add additional fee based on user preferences
      const maxPriorityFeePerGas =
        this.getPreferredPriorityFee(defaultPriorityFee);
      // See: https://eips.ethereum.org/EIPS/eip-1559 for formula
      const baseMaxFeePerGas = baseBlockFee.mul(2);
      const maxFeePerGas = baseMaxFeePerGas.add(maxPriorityFeePerGas);
      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
    } else {
      return {
        gasPrice: await this.getPreferredGasPrice(),
      };
    }
  }

  /**
   * Calculates the priority fee per gas according to user preferences
   * @param defaultPriorityFeePerGas - the base priority fee
   */
  private getPreferredPriorityFee(
    defaultPriorityFeePerGas: BigNumber
  ): BigNumber {
    const speed = this.options.gasSettings.speed;
    const maxGasPrice = this.options.gasSettings.maxPriceInGwei;
    let extraTip: BigNumber;
    switch (speed) {
      case "standard":
        extraTip = BigNumber.from(0); // default is 2.5 gwei for ETH, 31 gwei for polygon
        break;
      case "fast":
        extraTip = defaultPriorityFeePerGas.div(100).mul(5); // + 5% - 2.625 gwei / 32.5 gwei
        break;
      case "fastest":
        extraTip = defaultPriorityFeePerGas.div(100).mul(10); // + 10% - 2.75 gwei / 34.1 gwei
        break;
    }
    let txGasPrice = defaultPriorityFeePerGas.add(extraTip);
    const max = ethers.utils.parseUnits(maxGasPrice.toString(), "gwei"); // no more than max gas setting
    const min = ethers.utils.parseUnits("2.5", "gwei"); // no less than 2.5 gwei
    if (txGasPrice.gt(max)) {
      txGasPrice = max;
    }
    if (txGasPrice.lt(min)) {
      txGasPrice = min;
    }
    return txGasPrice;
  }

  /**
   * Calculates the gas price for transactions according to user preferences
   */
  public async getPreferredGasPrice(): Promise<BigNumber> {
    const gasPrice = await this.provider.getGasPrice();
    const speed = this.options.gasSettings.speed;
    const maxGasPrice = this.options.gasSettings.maxPriceInGwei;
    let txGasPrice = gasPrice;
    let extraTip;
    switch (speed) {
      case "standard":
        extraTip = BigNumber.from(1); // min 1 wei
        break;
      case "fast":
        extraTip = gasPrice.div(100).mul(5); // + 5%
        break;
      case "fastest":
        extraTip = gasPrice.div(100).mul(10); // + 10%
        break;
    }
    txGasPrice = txGasPrice.add(extraTip);
    const max = ethers.utils.parseUnits(maxGasPrice.toString(), "gwei");
    if (txGasPrice.gt(max)) {
      txGasPrice = max;
    }
    return txGasPrice;
  }
}
