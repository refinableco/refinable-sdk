import { Chain } from "..";
import { ChainType } from "../interfaces/Network";

export const optionalParam = <T = unknown>(shouldInclude: boolean, param: T) =>
  shouldInclude ? [param] : [];

export function selectChainType(chainId: Chain): ChainType {
  if ([Chain.BscMainnet, Chain.BscTestnet, Chain.Local].includes(chainId)) {
    return ChainType.BSC;
  } else if ([Chain.Ethereum, Chain.EthereumRinkeby].includes(chainId)) {
    return ChainType.ETH;
  } else if ([Chain.PolygonMainnet, Chain.PolygonTestnet].includes(chainId)) {
    return ChainType.ETH;
  }
}
