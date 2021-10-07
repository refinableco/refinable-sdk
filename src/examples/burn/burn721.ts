import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { TOKEN_TYPE } from "../../nft/nft";
import { StandardRoyaltyStrategy } from "../../nft/royaltyStrategies/StandardRoyaltyStrategy";
import { setupNft } from "../shared";

async function main() {
  const fileStream = fs.createReadStream(
    path.join(__dirname, "../mint/image.jpg")
  );

  try {
    // SDK: create an nft
    const nft = await setupNft(TOKEN_TYPE.ERC721);

    console.log("Minting >>>");
    const file = await nft.uploadFile(fileStream);
    // SDK: mint nft
    await nft.mint(
      {
        file,
        description: "some test description",
        name: "The Test NFT",
      },
      new StandardRoyaltyStrategy([])
    );

    // SDK: Burn nft
    console.log("Burning >>>");

    await nft.burn();

    console.log("Burning successful");
  } catch (error) {
    console.error(error);
  }
}

main();
