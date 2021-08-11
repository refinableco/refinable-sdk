import * as ethers from "ethers";
import { REFINABLE_NETWORK } from "./constants/network";
import { BSC_RPC, POLYGON_RPC } from "./constants/rpc";

export const createWallet = (
  privateKey: string,
  network: REFINABLE_NETWORK
) => {
  switch (network) {
    case REFINABLE_NETWORK.BSC:
      // https://docs.binance.org/smart-chain/developer/rpc.html
      return buildWallet(privateKey, BSC_RPC);
    case REFINABLE_NETWORK.POLYGON:
      // https://docs.matic.network/docs/develop/network-details/network/
      return buildWallet(privateKey, POLYGON_RPC);
    default:
      return buildWallet(privateKey, BSC_RPC);
  }
};

const buildWallet = (privateKey: string, rpcUrl: string): ethers.Wallet => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  return wallet;
};
