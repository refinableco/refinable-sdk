import { NodeWallet } from "@metaplex/js";
import { Keypair } from "@solana/web3.js";
import base58 from "bs58";
import * as dotenv from "dotenv";
import {
  Environment,
  RefinableEvmClient,
  RefinableSolanaClient,
  Chain,
  initializeWallet,
} from "../src";

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

  return RefinableEvmClient.create(wallet, API_KEY, {
    waitConfirmations: 1,
    environment,
  });
}

export function createRefinableClientSolana(environment: Environment) {
  const SECRET_KEY_SOL = process.env.SECRET_KEY_SOL as string;

  if (!SECRET_KEY_SOL) {
    throw new Error("No secret key found!");
  }

  const byte_array = base58.decode(SECRET_KEY_SOL);

  const payer = Keypair.fromSecretKey(byte_array);

  const wallet = new NodeWallet(payer);

  return RefinableSolanaClient.create(wallet, API_KEY, {
    environment,
  });
}
