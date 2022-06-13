import { Connection } from "@solana/web3.js";
import { getChainByNetworkId } from "../config/chains";
import { Chain } from "../interfaces/Network";

export const getConnectionByChainId = (chainId: Chain) => {
  const chain = getChainByNetworkId(chainId);
  return new Connection(chain.nodeUri[0]);
};
