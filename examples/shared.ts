import * as dotenv from "dotenv";
import { Chain } from "../src/interfaces/Network";
import { initializeWallet } from "../src/providers";
import { Refinable } from "../src/Refinable";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const API_KEY = process.env.API_KEY as string;

export function createRefinableClient(chainId: Chain) {
  const wallet = initializeWallet(PRIVATE_KEY, chainId);

  const graphqlUrl =
    [Chain.BscTestnet, Chain.EthereumRinkeby, Chain.PolygonTestnet].indexOf(
      chainId
    ) > -1
      ? "https://api-testnet.refinable.com/graphql"
      : "https://api.refinable.com/graphql";

  return Refinable.create(wallet, API_KEY, {
    waitConfirmations: 1,
    apiUrl: graphqlUrl,
  });
}
