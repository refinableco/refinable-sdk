import { ChainType, NetworkType } from './Network';

export class IChainConfig {
  name: string;
  displayName: string;
  nodeUri: string[];
  networkId: number;
  // Internal network name to fetch address from
  networkName?: string;
  networkType: NetworkType;
  chainType?: ChainType;
  explorerUri: string;
  supportedCurrencies: NativeCurrency[];
}

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
  native?: boolean;
  address?: string;
}

export interface Web3NetworkConfig {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: NativeCurrency;
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}
