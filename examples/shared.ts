import * as dotenv from "dotenv";
import { Chain, Environment, initializeWallet, Refinable } from "../src";
import { ClientType } from "../src/refinable/Refinable";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const API_KEY = process.env.API_KEY as string;

export async function createRefinableClient(chainId: Chain) {
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

  const client = await Refinable.create(API_KEY, {
    environment,
  });

  return client.connect(ClientType.Evm, wallet);
}
