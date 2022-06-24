import { Chain } from "../../src";
import { createRefinableClient } from "../shared";

async function main() {
  const chainId = Chain.BscTestnet;
  try {
    const refinable = await createRefinableClient(chainId);
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
