import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { Chain, StandardRoyaltyStrategy, PriceCurrency } from "../..";
import { createRefinableClient } from "../shared";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

async function main() {
  const refinable = await createRefinableClient(Chain.BscTestnet);

  const fileStream = fs.createReadStream(
    path.join(__dirname, "../mint/image.jpg")
  );

  try {
    console.log("Minting >>>");
    const file = await refinable.uploadFile(fileStream);
    // SDK: mint nft
    const nft = await refinable
      .nftBuilder()
      .erc721({
        file,
        description: "some test description",
        name: "The Test NFT",
        royalty: new StandardRoyaltyStrategy([]),
        chainId: Chain.BscTestnet,
      })
      .createAndMint();

    // SDK: Burn nft
    console.log("Burning >>>");

    await nft.burn();

    console.log("Burning successful");
  } catch (error) {
    console.error(error);
  }
}

main();
