import dotenv from "dotenv";
import { createRefinableClientSolana } from '../shared';
import { QUOTE_MINT } from "../../src/solana/constants";
import { Environment } from "../../src";
  
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

async function main() {
    const refinable = await createRefinableClientSolana(Environment.Local);

    const { whitelistedCreators, items } = await refinable.getItemsFromChain();
    if (!items.length) {
        console.log('No items to sell!');
        return;
    }

    const nft = refinable.createNft(items[0]);
    await nft.putForSale(whitelistedCreators, QUOTE_MINT.toBase58())

    console.log('Done putting item on sale');
}

main()