import dotenv from "dotenv";
import { Chain, initializeWallet, RefinableEvmClient } from "../../src";
import { createRefinableClient } from "../shared";


async function main() {
  const chainId = Chain.BscTestnet;
  try {
    const refinable = await createRefinableClient(chainId);
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
