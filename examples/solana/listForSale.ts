import dotenv from "dotenv";
import { createRefinableClientSolana } from '../shared';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

async function main() {
    const refinable = await createRefinableClientSolana();
    await refinable.getItemsAndPutFirstItemOnSale()
}

main()