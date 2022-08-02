import { Chain } from "..";
import { ChainType } from "../interfaces/Network";

export const optionalParam = <T = unknown>(
  shouldInclude: boolean,
  ...args: T[]
) => (shouldInclude ? [...args] : []);

export function selectChainType(chainId: Chain): ChainType {
  if ([Chain.BscMainnet, Chain.BscTestnet, Chain.Local].includes(chainId)) {
    return ChainType.BSC;
  } else if ([Chain.Ethereum, Chain.EthereumRinkeby].includes(chainId)) {
    return ChainType.ETH;
  } else if ([Chain.PolygonMainnet, Chain.PolygonTestnet].includes(chainId)) {
    return ChainType.POLYGON;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
