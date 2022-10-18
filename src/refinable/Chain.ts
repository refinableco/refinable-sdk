import { utils } from "ethers";
import { PriceInput } from "../@types/graphql";
import { chainMap } from "../config/chains";
import { IChainConfig, NativeCurrency } from "../interfaces/Config";
import { CoinClient } from "./coin/CoinClient";

export class Chain {
  protected _chain: IChainConfig;

  constructor(
    public readonly chainId: number,
    public readonly coinClient: CoinClient
  ) {
    if (!chainMap[chainId]) {
      throw new Error(`Chain ${chainId} is not supported`);
    }
    this._chain = chainMap[this.chainId];
  }

  get supportedCurrencies() {
    return this._chain.supportedCurrencies;
  }

  public async getCurrency(priceCurrency: string): Promise<NativeCurrency> {
    const coin = await this.getCoin({ id: priceCurrency });

    return {
      decimals: coin.contract.decimals,
      name: coin.name,
      symbol: coin.ticker,
      address: coin.contract.address,
      native: coin.contract.isNative,
    };
  }

  public getCoin({
    id,
    coingeckoId,
    name,
  }: {
    id?: string;
    coingeckoId?: string;
    name?: string;
  }) {
    // search by id
    if (id) {
      return this.coinClient.getCoin({ chainId: this.chainId, id });
    }

    if (coingeckoId) {
      return this.coinClient.getCoin({ chainId: this.chainId, coingeckoId });
    }

    // search, not accurate
    if (name) {
      return this.coinClient.getCoin({ chainId: this.chainId, name });
    }

    throw new Error("id, coingeckoId or name should be set");
  }

  public parseUnits(decimals: number, amount: number) {
    return utils.parseUnits(amount.toString(), decimals).toString();
  }

  public async getPriceWithBuyServiceFee(
    price: PriceInput,
    serviceFeeBps: number,
    amount = 1
  ): Promise<PriceInput> {
    const coin = await this.coinClient.getCoin({
      chainId: this.chainId,
      id: price.currency,
    });

    // We need to do this because of the rounding in our contracts
    const weiAmount = utils
      .parseUnits(price.amount.toString(), coin.contract.decimals)
      .mul(10000 + serviceFeeBps)
      .div(10000)
      .toString();

    return {
      ...price,
      amount:
        Number(utils.formatUnits(weiAmount, coin.contract.decimals)) * amount,
    };
  }
}
