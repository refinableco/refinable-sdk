import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { TOKEN_TYPE } from "../../nft/nft";
import * as fs from "fs";
import * as path from "path";
import { StandardRoyaltyStrategy } from "../../nft/royaltyStrategies/StandardRoyaltyStrategy";
import { PriceCurrency } from "../../@types/graphql";
import { setupNft } from "../shared";

async function main() {
  const nft = await setupNft(TOKEN_TYPE.ERC1155);

  const fileStream = await fs.createReadStream(
    path.join(__dirname, "image.jpg")
  );

  console.log("Minting...");
  const file = await nft.uploadFile(fileStream);

  // SDK: mint nft
  await nft.mint(
    {
      file,
      description: "some test description",
      name: "The Test NFT",
      supply: 5,
    },
    new StandardRoyaltyStrategy([])
  );

  // SDK: Put for sale
  await nft.putForSale(
    {
      amount: 0.1,
      currency: PriceCurrency.Bnb,
    },
    4
  );
}

main();
