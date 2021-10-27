## Get started

**How to put item on sale on Solana**

1. Run metaplex UI repo
2. Install Phantom wallet and switch to devnet
3. Haven't tested with multiple items, so make sure in My Items/Owned you have no items. You can put existing items on sale.
4. Create your ONLY item with Create button
| --------------------------------------- | 
5. Go to SDK source codes, set MY_SOL_PUBLIC_KEY and MY_SOL_SECRET_KEY accordingly (in listForSaleSolana.ts)
6. Then go to root folder of the SDK, run `npx ts-node examples/solana/listForSaleSolana.ts`
