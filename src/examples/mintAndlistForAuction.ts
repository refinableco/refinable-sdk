import dotenv from "dotenv";
dotenv.config({ path: ".env.testnet" });

import { TOKEN_TYPE } from "../nft/nft";
import * as fs from "fs";
import * as path from "path";
import { StandardRoyaltyStrategy } from "../nft/royaltyStrategies/StandardRoyaltyStrategy";
import { PriceCurrency } from "../@types/graphql";
import { setupNft } from "./shared";

async function main() {
  const nft = await setupNft(TOKEN_TYPE.ERC721);

  const fileStream = await fs.createReadStream(
    path.join(__dirname, "mint/image.jpg")
  );

  // SDK: mint nft
  console.log("...minting");
  await nft.mint(
    {
      file: fileStream,
      description: "some test description",
      name: "The Auction Test NFT721",
    },
    new StandardRoyaltyStrategy([])
  );

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
