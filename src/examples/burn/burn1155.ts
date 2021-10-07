import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { TOKEN_TYPE } from "../../nft/nft";
import { StandardRoyaltyStrategy } from "../../nft/royaltyStrategies/StandardRoyaltyStrategy";
import { setupNft } from "../shared";
import { createWallet } from "../../providers";
import { Chain } from "../../interfaces/Network";

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

async function main() {
  const chainId = Chain.EthereumRinkeby;
  const wallet = createWallet(PRIVATE_KEY, chainId);

  const address = await wallet.getAddress();

  const fileStream = fs.createReadStream(
    path.join(__dirname, "../mint/image.jpg")
  );

  // SDK: create an nft
  try {
    const nft = await setupNft(TOKEN_TYPE.ERC1155);

    console.log("minting >>>");
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

    console.log("burning >>>");

    // SDK: burn item
    await nft.burn(5);

    console.log("burning successful!");
  } catch (error) {
    console.error(error);
  }
}

main();
