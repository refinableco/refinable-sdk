import * as dotenv from "dotenv";
import { Chain, ChainType } from "../src/interfaces/Network";
import { initializeWallet } from "../src/providers";
import { Refinable, Environment } from "../src";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const API_KEY = process.env.API_KEY as string;

export function selectChainType(chainId: Chain): ChainType {
  if (chainId in [Chain.BscMainnet, Chain.BscTestnet, Chain.Local]) {
    return ChainType.BSC;
  } else if (chainId in [Chain.Ethereum, Chain.EthereumRinkeby]) {
    return ChainType.ETH;
  } else if (chainId in [Chain.PolygonMainnet, Chain.PolygonTestnet]) {
    return ChainType.ETH;
  }
}

export function createRefinableClient(chainId: Chain) {
  const wallet = initializeWallet(PRIVATE_KEY, chainId);

  let environment = [
    Chain.BscTestnet,
    Chain.EthereumRinkeby,
    Chain.PolygonTestnet,
  ].includes(chainId)
    ? Environment.Testnet
    : Environment.Mainnet;
  if (chainId === Chain.Local) {
    environment = Environment.Local;
  }

  const chain = selectChainType(chainId);

  return Refinable.create(wallet, API_KEY, {
    waitConfirmations: 1,
    environment,
    chainType: chain,
  });
}
