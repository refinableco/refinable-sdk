import { getChainByNetworkId } from "../config/chains";
import { Chain } from "../interfaces/Network";

export const getConnectionByChainId = (chainId: Chain) => {
  const chain = getChainByNetworkId(chainId);
  return chain.nodeUri[0];
};
