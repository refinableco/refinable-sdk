import * as dotenv from "dotenv";
import { Chain } from "../src/interfaces/Network";
import { initializeWallet } from "../src/providers";
import { Refinable, Environment } from "../src";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const API_KEY = process.env.API_KEY as string;

export function createRefinableClient(chainId: Chain) {
  const wallet = initializeWallet(PRIVATE_KEY, chainId);

  const environment = [
    Chain.BscTestnet,
    Chain.EthereumRinkeby,
    Chain.PolygonTestnet,
  ].includes(chainId)
    ? Environment.Testnet
    : Environment.Mainnet;

  return Refinable.create(wallet, API_KEY, {
    waitConfirmations: 1,
    environment,
  });
}
