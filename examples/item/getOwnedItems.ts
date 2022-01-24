import dotenv from "dotenv";
import { Chain, initializeWallet, RefinableEvmClient } from "../../src";

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
    console.log("Getting owned items by a user...");
    const res = await refinable.getOwnedItems(10);
    console.log("item fetched ✅");

    console.log("fetching next 10 items...");
    let lastCursor = res["pageInfo"]["endCursor"];
    await refinable.getOwnedItems(10, lastCursor);
    console.log("items are fetched ✅");
  } catch (error) {
    console.error(error);
  }
}

main();
