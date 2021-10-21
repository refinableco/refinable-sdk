import { BigNumber } from "ethers";
import { NativeCurrency } from "../interfaces/Config";

export function getSupportedCurrency(
  supportedCurrencies: NativeCurrency[],
  symbol: string
) {
  const found = supportedCurrencies.find((c) => c.symbol === symbol);
  if (!found) {
    throw new Error(`Currency ${symbol} is not supported`);
  }
  return found;
}

export const parseBPS = (numberBPS: BigNumber): number => {
  return BigNumber.from(numberBPS._hex).toNumber();
};