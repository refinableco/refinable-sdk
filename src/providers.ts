import * as ethers from "ethers";
import { chainMap } from "./chains";
import { Chain } from "./interfaces/Network";

export const createWallet = (privateKey: string, chain: Chain) => {
  return buildWallet(privateKey, chainMap[chain].nodeUri[0]);
};

const buildWallet = (privateKey: string, rpcUrl: string): ethers.Wallet => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  return wallet;
};
