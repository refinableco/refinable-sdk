import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { TOKEN_TYPE } from "../../nft/nft";
import * as fs from "fs";
import * as path from "path";
import { StandardRoyaltyStrategy } from "../../nft/royaltyStrategies/StandardRoyaltyStrategy";
import { PriceCurrency } from "../../@types/graphql";
import { setupNft } from "../shared";

async function main() {
  const nft = await setupNft(TOKEN_TYPE.ERC721);

  const fileStream = await fs.createReadStream(
    path.join(__dirname, "image.jpg")
  );

  console.log("Minting...");

  // SDK: mint nft
  await nft.mint(
    {
      file: fileStream,
      description: "some test description",
      name: "The Test NFT",
    },
    new StandardRoyaltyStrategy([])
  );

  console.log("Listing for sale...");

  // SDK: Put for sale
  await nft.putForSale({
    amount: 1,
    currency: PriceCurrency.Bnb,
  });
}

main();
