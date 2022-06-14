import { Chain } from "../../src";
import { createRefinableClient } from "../shared";

async function main() {
  const chainId = Chain.BscTestnet;
  try {
    const refinable = await createRefinableClient(chainId);
    console.log("fetching items...");
    const res = await refinable.offer.getItemsOnAuction({}, 5);
    console.log("item fetched ✅");

    console.log("fetching next 5 items...");
    let pivot = res["pageInfo"]["endCursor"];
    await refinable.offer.getItemsOnAuction({}, 5, pivot);
    console.log("items are fetched ✅");
  } catch (error) {
    console.error(error);
  }
}

main();
