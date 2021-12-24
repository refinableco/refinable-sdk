import { ENV as ChainId } from '@solana/spl-token-registry';
import { clusterApiUrl } from '@solana/web3.js';

export enum ChainType {
  BSC = "bsc",
  POLYGON = "polygon",
  ETH = "ethereum",
  SOLANA = 'solana',
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
  // Solana
  SolanaMainnetBeta = 101,
  SolanaTestnet = 102,
  SolanaDevnet = 103,
  SolanaLocalnet = 104,
}

export type ENV_SOL =
  | 'mainnet-beta'
  | 'mainnet-beta (Solana)'
  | 'mainnet-beta (Serum)'
  | 'testnet'
  | 'devnet'
  | 'localnet'
  | 'lending';

export const ENDPOINTS_SOL = [
  {
    name: 'mainnet-beta' as ENV_SOL,
    endpoint: 'https://api.metaplex.solana.com/',
    ChainId: ChainId.MainnetBeta,
  },
  {
    name: 'mainnet-beta (Solana)' as ENV_SOL,
    endpoint: 'https://api.mainnet-beta.solana.com',
    ChainId: ChainId.MainnetBeta,
  },
  {
    name: 'mainnet-beta (Serum)' as ENV_SOL,
    endpoint: 'https://solana-api.projectserum.com/',
    ChainId: ChainId.MainnetBeta,
  },
  {
    name: 'testnet' as ENV_SOL,
    endpoint: clusterApiUrl('testnet'),
    ChainId: ChainId.Testnet,
  },
  {
    name: 'devnet' as ENV_SOL,
    endpoint: clusterApiUrl('devnet'),
    ChainId: ChainId.Devnet,
  },
];