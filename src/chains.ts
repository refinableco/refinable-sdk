import { IChainConfig } from "./interfaces/Config";
import { Chain, ChainType, NetworkType } from "./interfaces/Network";

const chainConfigBase: IChainConfig = {
  name: "unknown",
  displayName: "unknown",
  shortName: "Unknown",
  networkId: null,
  networkType: NetworkType.UNKNOWN,
  nodeUri: ["http://localhost:8545"],
  explorerUri: "http://localhost:8545/",
  supportedCurrencies: [],
};

export const chainMap: Record<Chain, IChainConfig> = {
  [Chain.Local]: {
    // local
    ...chainConfigBase,
    name: "Smart Chain - local",
    displayName: "Smart Chain - local",
    shortName: "Smart Chain - local",
    networkId: Chain.Local,
    networkName: "development",
    networkType: NetworkType.LOCAL,
    chainType: ChainType.BSC,
    supportedCurrencies: [
      {
        name: "BNB",
        symbol: "BNB",
        decimals: 18,
        native: true,
        address: "0x0000000000000000000000000000000000000000",
      },
      {
        name: "USDT",
        symbol: "USDT",
        decimals: 18,
        address: "0x0000000000000000000000000000000000000000",
      },
    ],
  },
  [Chain.BscMainnet]: {
    ...chainConfigBase,
    name: "Binance Smart Chain",
    displayName: "BSC",
    shortName: "Binance Smart Chain",
    networkId: Chain.BscMainnet,
    networkName: "bsc",
    networkType: NetworkType.MAINNET,
    chainType: ChainType.BSC,
    nodeUri: [
      "https://bsc-dataseed1.ninicoin.io",
      "https://bsc-dataseed1.defibit.io",
      "https://bsc-dataseed.binance.org",
    ],
    explorerUri: "https://bscscan.com/",
    supportedCurrencies: [
      {
        name: "BNB",
        symbol: "BNB",
        decimals: 18,
        native: true,
        address: "0x0000000000000000000000000000000000000000",
      },
      {
        name: "USDT",
        symbol: "USDT",
        decimals: 18,
        address: "0x55d398326f99059ff775485246999027b3197955",
      },
      {
        name: "BUSD",
        symbol: "BUSD",
        decimals: 18,
        address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
      },
    ],
  },
  [Chain.BscTestnet]: {
    ...chainConfigBase,
    name: "Binance Smart Chain - Testnet",
    displayName: "BSC",
    shortName: "Binance Smart Chain - Testnet",
    networkId: Chain.BscTestnet,
    networkName: "bsc-testnet",
    networkType: NetworkType.TESTNET,
    chainType: ChainType.BSC,
    nodeUri: [
      "https://data-seed-prebsc-2-s3.binance.org:8545/",
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
      "https://data-seed-prebsc-2-s1.binance.org:8545/",
      "https://data-seed-prebsc-1-s2.binance.org:8545/",
      "https://data-seed-prebsc-2-s2.binance.org:8545/",
      "https://data-seed-prebsc-1-s3.binance.org:8545/",
    ],
    explorerUri: "https://testnet.bscscan.com/",
    supportedCurrencies: [
      {
        name: "BNB",
        symbol: "BNB",
        decimals: 18,
        native: true,
        address: "0x0000000000000000000000000000000000000000",
      },
      {
        name: "USDT",
        symbol: "USDT",
        decimals: 18,
        address: "0x337610d27c682e347c9cd60bd4b3b107c9d34ddd",
      },
      {
        name: "BUSD",
        symbol: "BUSD",
        decimals: 18,
        address: "0x8301f2213c0eed49a7e28ae4c3e91722919b8b47",
      },
    ],
  },
  [Chain.PolygonMainnet]: {
    ...chainConfigBase,
    name: "Polygon (Matic Network) Mainnet",
    displayName: "Polygon",
    shortName: "Polygon",
    networkId: Chain.PolygonMainnet,
    networkName: "polygon",
    networkType: NetworkType.MAINNET,
    chainType: ChainType.POLYGON,
    nodeUri: [
      "https://matic-mainnet.chainstacklabs.com",
      "https://rpc-mainnet.matic.quiknode.pro",
    ],
    explorerUri: "https://polygonscan.com/",
    supportedCurrencies: [
      {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
        native: true,
        address: "0x0000000000000000000000000000000000000000",
      },
      {
        name: "USDT",
        symbol: "USDT",
        decimals: 18,
        address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
      },
      {
        name: "WETH",
        symbol: "WETH",
        decimals: 18,
        address: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
      },
    ],
  },
  [Chain.PolygonTestnet]: {
    ...chainConfigBase,
    name: "Polygon (Matic Network) - Mumbai-Testnet",
    displayName: "Polygon",
    networkId: Chain.PolygonTestnet,
    networkName: "polygon-mumbai",
    networkType: NetworkType.TESTNET,
    chainType: ChainType.POLYGON,
    nodeUri: [
      "https://matic-mumbai.chainstacklabs.com",
      "https://rpc-mumbai.maticvigil.com",
    ],
    explorerUri: "https://mumbai.polygonscan.com/",
    supportedCurrencies: [
      {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
        native: true,
        address: "0x0000000000000000000000000000000000000000",
      },
    ],
  },
  [Chain.Ethereum]: {
    ...chainConfigBase,
    name: "Ethereum",
    displayName: "Ethereum",
    shortName: "Ethereum",
    networkId: Chain.Ethereum,
    networkName: "ethereum",
    networkType: NetworkType.MAINNET,
    chainType: ChainType.ETH,
    nodeUri: ["https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"],
    explorerUri: "https://etherscan.io/",
    supportedCurrencies: [
      {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
        native: true,
        address: "0x0000000000000000000000000000000000000000",
      },
      {
        name: "USDT",
        symbol: "USDT",
        decimals: 18,
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      },
      {
        name: "WETH",
        symbol: "WETH",
        decimals: 18,
        address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      },
      {
        name: "USDC",
        symbol: "USDC",
        decimals: 18,
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      },
    ],
  },
  [Chain.EthereumRinkeby]: {
    ...chainConfigBase,
    name: "Ethereum Rinkeby",
    displayName: "Rinkeby",
    shortName: "Ethereum Rinkeby",
    networkId: Chain.EthereumRinkeby,
    networkName: "rinkeby",
    networkType: NetworkType.TESTNET,
    chainType: ChainType.ETH,
    nodeUri: ["https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"],
    explorerUri: "https://rinkeby.etherscan.io/",
    supportedCurrencies: [
      {
        name: "ETH",
        symbol: "ETH",
        decimals: 18,
        native: true,
        address: "0x0000000000000000000000000000000000000000",
      },
      {
        name: "USDT",
        symbol: "USDT",
        decimals: 18,
        address: "0x3b00ef435fa4fcff5c209a37d1f3dcff37c705ad",
      },
      {
        name: "WETH",
        symbol: "WETH",
        decimals: 18,
        address: "0xc778417e063141139fce010982780140aa0cd5ab",
      },
      {
        name: "USDC",
        symbol: "USDC",
        decimals: 18,
        address: "0xeb8f08a975ab53e34d8a0330e0d34de942c95926",
      },
    ],
  },
};

export const chains: IChainConfig[] = [
  {
    ...chainConfigBase,
  },
  ...Object.values(chainMap),
];

export function getChainByNetworkId(chain: Chain) {
  const foundChain = chains.find((c) => c.networkId === chain);
  if (!foundChain) {
    throw new Error(`Chain is not supported: ${chain}`);
  }
  return foundChain;
}
