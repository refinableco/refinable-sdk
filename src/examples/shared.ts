import * as dotenv from "dotenv";
import { Chain } from "../interfaces/Network";
import { createWallet } from "../providers";
import { Refinable } from "../Refinable";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const API_KEY = process.env.API_KEY as string;

export function createRefinableClient(chainId: Chain) {
  const wallet = createWallet(PRIVATE_KEY, chainId);

  return Refinable.create(wallet, API_KEY, {
    waitConfirmations: 1,
  });
}
