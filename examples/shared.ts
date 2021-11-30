import { Connection, Keypair } from "@solana/web3.js";
import base58 from "bs58";
import * as dotenv from "dotenv";
import { Chain, ENDPOINTS_SOL } from "../src/interfaces/Network";
import { initializeWallet } from "../src/providers";
import { Refinable, Environment } from "../src/Refinable";
import { RefinableSolana } from "../src/RefinableSolana";
import { NodeWallet } from "../src/solana/wallet";


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

export function createRefinableClientSolana() {
  const apiUrl = process.env.NODE_ENV === 'testnet' 
      ? "https://api-testnet.refinable.com/graphql"
      : "https://api.refinable.com/graphql";

  const SECRET_KEY_SOL = process.env.SECRET_KEY_SOL as string;

  if (!SECRET_KEY_SOL) {
    throw new Error('No secret key found!')
  }

  const byte_array = base58.decode(SECRET_KEY_SOL)
  
  const payer = Keypair.fromSecretKey(
    byte_array
  );

  const DEFAULT = ENDPOINTS_SOL.find((ep)=>ep.name==='devnet').endpoint;

  const connection = new Connection(DEFAULT, 'recent');    

  const wallet = new NodeWallet(payer);

  return RefinableSolana.create(wallet, connection, API_KEY, {
    apiUrl
  });
}
