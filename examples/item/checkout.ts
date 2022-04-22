import dotenv from "dotenv";
import {
  Chain,
  Environment,
  initializeWallet,
  RefinableEvmClient,
} from "../../src";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const API_KEY = process.env.API_KEY as string;

async function main() {
  const chainId = Chain.BscTestnet;
  const wallet = initializeWallet(PRIVATE_KEY, chainId);
  try {
    const refinable = await RefinableEvmClient.create(wallet, API_KEY, {
      waitConfirmations: 1,
      environment: Environment.Testnet,
    });

    const res = await refinable.getItemsOnSale({}, 2);

    const response = await refinable.checkout.create({
      offerId: res?.edges?.[0].node.nextEditionForSale.id,
    });

    console.log(response.url);
  } catch (error) {
    console.error(error);
  }
}

main();
