import * as ethers from "ethers";
import { chainMap } from "./config/chains";
import { Chain } from "./interfaces/Network";

export const initializeWallet = (privateKey: string, chain: Chain) => {
  const chainConfig = chainMap[chain];
  if (!chainConfig) throw new Error("Unsupported chain");

  return buildWallet(privateKey, chainConfig.nodeUri[0]);
};

const buildWallet = (privateKey: string, rpcUrl: string): ethers.Wallet => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  return wallet;
};
