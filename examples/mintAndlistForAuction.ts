import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { Chain, PriceCurrency, StandardRoyaltyStrategy } from "../src";
import { createRefinableClient } from "./shared";

dotenv.config({ path: ".env.testnet" });

async function main() {
  const refinable = await createRefinableClient(Chain.BscTestnet);

  const fileStream = fs.createReadStream(
    path.join(__dirname, "mint/image.jpg")
  );

  // SDK: mint nft
  console.log("...minting");

  const nft = await refinable
    .nftBuilder()
    .erc721({
      nftFile: fileStream,
      description: "some test description",
      name: "The Auction Test NFT721",
      royalty: new StandardRoyaltyStrategy([]),
      chainId: Chain.BscTestnet,
    })
    .createAndMint();

  // SDK: Put for sale
  console.log("...putting for auction");
  await nft.putForAuction({
    auctionStartDate: new Date(Date.now() + 300000),
    auctionEndDate: new Date(Date.now() + 900000),
    price: {
      amount: 1,
      currency: PriceCurrency.Bnb,
    },
  });
}

main();
