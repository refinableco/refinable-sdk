import { Chain } from "../../src";
import { createRefinableClient } from "../shared";

async function main() {
  const chainId = Chain.BscTestnet;
  try {
    const refinable = await createRefinableClient(chainId);

    const res = await refinable.offer.getItemsOnSale({}, 2);

    const response = await refinable.checkout.create({
      offerId: res?.edges?.[0].node.nextEditionForSale.id,
    });

    console.log(response.url);
  } catch (error) {
    console.error(error);
  }
}

main();
