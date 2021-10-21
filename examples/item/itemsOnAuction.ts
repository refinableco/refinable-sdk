import dotenv from "dotenv";
import { Chain, Refinable } from "../../";
import { createWallet } from "../../src/providers";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const API_KEY = process.env.API_KEY as string;

async function main() {
  const chainId = Chain.BscTestnet;
  const wallet = createWallet(PRIVATE_KEY, chainId);
  try {
    const refinable = await Refinable.create(wallet, API_KEY, {
      waitConfirmations: 1,
    });
    console.log("fetching items...");
    const res = await refinable.getItemsOnAuction(5);
    console.log("item fetched ✅");

    console.log("fetching next 5 items...");
    let pivot = res["pageInfo"]["endCursor"];
    await refinable.getItemsOnAuction(5, pivot);
    console.log("items are fetched ✅");
  } catch (error) {
    console.error(error);
  }
}

main();
