export enum ChainType {
  BSC = "bsc",
  POLYGON = "polygon",
  ETH = "ethereum",
}

export enum NetworkType {
  MAINNET = "mainnet",
  TESTNET = "testnet",
  LOCAL = "local",
  UNKNOWN = "unknown",
}

export enum Chain {
  // BSC
  Local = 1337,
  BscTestnet = 97,
  BscMainnet = 56,
  // Polygon
  PolygonTestnet = 80001,
  PolygonMainnet = 137,
  // Ethereum
  Ethereum = 1,
  EthereumRinkeby = 4,
  EthereumGoerli = 5,
}

export type EVM_CHAIN_IDS =
  | Chain.Local
  | Chain.BscMainnet
  | Chain.BscTestnet
  | Chain.PolygonMainnet
  | Chain.PolygonTestnet
  | Chain.Ethereum
  | Chain.EthereumGoerli;
