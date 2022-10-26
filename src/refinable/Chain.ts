import { utils } from "ethers";
import { chainMap } from "../config/chains";
import { IChainConfig, NativeCurrency } from "../interfaces/Config";
import { IPrice } from "../nft/interfaces/Price";

export class Chain {
  protected _chain: IChainConfig;

  constructor(public readonly chainId: number) {
    if (!chainMap[chainId]) {
      throw new Error(`Chain ${chainId} is not supported`);
    }
    this._chain = chainMap[this.chainId];
  }

  get supportedCurrencies() {
    return this._chain.supportedCurrencies;
  }

  public parseUnits(decimals: number, amount: number) {
    return utils.parseUnits(amount.toString(), decimals).toString();
  }

  public async getPriceWithBuyServiceFee(
    price: IPrice,
    serviceFeeBps: number,
    amount = 1
  ): Promise<IPrice> {
    // We need to do this because of the rounding in our contracts
    const weiAmount = utils
      .parseUnits(price.amount.toString(), price.decimals)
      .mul(10000 + serviceFeeBps)
      .div(10000)
      .toString();

    return {
      ...price,
      amount: Number(utils.formatUnits(weiAmount, price.decimals)) * amount,
    };
  }
}
