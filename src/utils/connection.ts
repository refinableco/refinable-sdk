import { Connection } from "@solana/web3.js";
import { Chain } from "..";
import { getChainByNetworkId } from "../config/chains";

export const getConnectionByChainId = (chainId: Chain) => {
  const chain = getChainByNetworkId(chainId);
  return new Connection(chain.nodeUri[0]);
};
