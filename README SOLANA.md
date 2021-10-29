## Get started

**How to put item on sale on Solana**

1. Run metaplex UI repo
2. Install Phantom wallet and switch to devnet
3. Haven't tested with multiple items, so make sure in My Items/Owned you have no items. You can put existing items on sale.
4. Create your item with Create button
| --------------------------------------- | 
5. Set SECRET_KEY_SOL in env.devnet file
6. Then go to root folder of the SDK, run `NODE_ENV=devnet npx ts-node examples/solana/listForSale.ts`
7. You can try to buy the item by switching wallet