import dotenv from "dotenv";
import { initializeWallet, RefinableEvmClient, Chain } from "../../src";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const API_KEY = process.env.API_KEY as string;

async function main() {
  const chainId = Chain.BscTestnet;
  const wallet = initializeWallet(PRIVATE_KEY, chainId);
  try {
    const refinable = await RefinableEvmClient.create(wallet, API_KEY, {
      waitConfirmations: 1,
    });
    console.log("Getting created items by a user...");
    const res = await refinable.getCreatedItems(5);
    console.log("item fetched ✅");

    console.log("fetching next 5 items...");
    let lastCursor = res["pageInfo"]["endCursor"];
    await refinable.getCreatedItems(5, lastCursor);
    console.log("items are fetched ✅");
  } catch (error) {
    console.error(error);
  }
}

main();
