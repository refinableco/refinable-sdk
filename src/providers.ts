import * as ethers from "ethers";
import { REFINABLE_NETWORK } from "./constants/network";

export const createWallet = (
  privateKey: string,
  network: REFINABLE_NETWORK
) => {
  switch (network) {
    case REFINABLE_NETWORK.BSC_MAINNET:
      // https://docs.binance.org/smart-chain/developer/rpc.html
      return buildWallet(privateKey, "https://bsc-dataseed.binance.org/");
    case REFINABLE_NETWORK.POLYGON_MAINNET:
      // https://docs.matic.network/docs/develop/network-details/network/
      return buildWallet(privateKey, "https://rpc-mainnet.matic.network");
    default:
      return buildWallet(privateKey, "https://bsc-dataseed.binance.org/");
  }
};

const buildWallet = (privateKey: string, rpcUrl: string): ethers.Wallet => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  return wallet;
};
