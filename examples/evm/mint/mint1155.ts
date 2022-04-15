import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { Chain, StandardRoyaltyStrategy, PriceCurrency } from "../../../src";
import { createRefinableClient } from "../../shared";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

async function main() {
  const refinable = await createRefinableClient(Chain.BscTestnet);

  const fileStream = fs.createReadStream(path.join(__dirname, "image.jpg"));

  console.log("Minting...");

  // SDK: mint nft
  const nft = await refinable
    .nftBuilder()
    .erc1155({
      nftFile: fileStream,
      description: "some test description",
      name: "The Test NFT",
      royalty: new StandardRoyaltyStrategy([]),
      chainId: Chain.BscTestnet,
      supply: 5,
    })
    .createAndMint();

  // SDK: Put for sale
  await nft.putForSale({
    price: {
      amount: 0.1,
      currency: PriceCurrency.Bnb,
    },
    supply: 4,
  });
}

main();
