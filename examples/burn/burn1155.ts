import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { Chain, StandardRoyaltyStrategy } from "../../src";
import { createRefinableClient } from "../shared";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

async function main() {
  const refinable = await createRefinableClient(Chain.BscTestnet);

  const fileStream = fs.createReadStream(
    path.join(__dirname, "../mint/image.jpg")
  );

  // SDK: create an nft
  try {
    console.log("minting >>>");
    const file = await refinable.uploadFile(fileStream);

    // SDK: mint nft
    const nft = await refinable
      .nftBuilder()
      .erc1155({
        file,
        description: "some test description",
        name: "The Test NFT",
        royalty: new StandardRoyaltyStrategy([]),
        chainId: Chain.BscTestnet,
        supply: 5,
      })
      .createAndMint();

    console.log("burning >>>");

    // SDK: burn item
    await nft.burn(5);

    console.log("burning successful!");
  } catch (error) {
    console.error(error);
  }
}

main();
