import { PriceCurrency } from "../@types/graphql";
import { chainMap } from "../config/chains";
import { IChainConfig } from "../interfaces/Config";
import { getSupportedCurrency } from "../utils/chain";
import { utils } from "ethers";

export class Chain {
  protected _chain: IChainConfig;

  constructor(private readonly chainId: number) {
    if (!chainMap[chainId]) {
      throw new Error(`Chain ${chainId} is not supported`);
    }
    this._chain = chainMap[this.chainId];
  }

  get supportedCurrencies() {
    return this._chain.supportedCurrencies;
  }

  public getPaymentToken(priceCurrency: PriceCurrency) {
    const currency = this._chain.supportedCurrencies.find(
      (c) => c.symbol === priceCurrency
    );

    if (!currency) throw new Error("Unsupported currency");

    return currency.address;
  }

  public getCurrency(priceCurrency: PriceCurrency) {
    return getSupportedCurrency(this._chain.supportedCurrencies, priceCurrency);
  }

  public isNativeCurrency(priceCurrency: PriceCurrency) {
    const currency = this.getCurrency(priceCurrency);

    return currency && currency.native === true;
  }
  public parseCurrency(priceCurrency: PriceCurrency, amount: number) {
    const currency = this.getCurrency(priceCurrency);

    return utils.parseUnits(amount.toString(), currency.decimals).toString();
  }
}