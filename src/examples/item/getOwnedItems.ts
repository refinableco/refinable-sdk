import dotenv from "dotenv";
import { Chain } from "../../interfaces/Network";
import { createWallet } from "../../providers";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import { Refinable } from "../../Refinable";
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const API_KEY = process.env.API_KEY as string;

async function main() {
  const chainId = Chain.BscTestnet;
  const wallet = createWallet(PRIVATE_KEY, chainId);
  try {
    const refinable = await Refinable.create(wallet, API_KEY, {
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
