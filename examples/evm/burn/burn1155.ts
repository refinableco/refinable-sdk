import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { Chain, StandardRoyaltyStrategy } from "../../../src";
import { createRefinableClient } from "../../shared";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

async function main() {
  const refinable = await createRefinableClient(Chain.BscTestnet);

  const fileStream = fs.createReadStream(
    path.join(__dirname, "../mint/image.jpg")
  );

  // SDK: create an nft
  try {
    console.log("minting >>>");

    // SDK: mint nft
    const nft = await refinable
      .evm.nftBuilder()
      .erc1155({
        nftFile: fileStream,
        description: "some test description",
        name: "The Test NFT",
        royalty: new StandardRoyaltyStrategy([]),
        chainId: Chain.BscTestnet,
        supply: 5,
      })
      .createAndMint();

    console.log("burning >>>");

    // SDK: burn item
    await nft.burn(5, "<address of the owner you want to burn the NFTs from>");

    console.log("burning successful!");
  } catch (error) {
    console.error(error);
  }
}

main();
