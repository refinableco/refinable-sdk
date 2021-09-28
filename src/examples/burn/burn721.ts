import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { Refinable } from "../../Refinable";
import { TOKEN_TYPE } from "../../nft/nft";
import { createWallet } from "../../providers";
import { REFINABLE_NETWORK } from "../../constants/network";
import * as fs from "fs";
import * as path from "path";
import { StandardRoyaltyStrategy } from "../../nft/royaltyStrategies/StandardRoyaltyStrategy";

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

async function main() {
  const wallet = createWallet(PRIVATE_KEY, REFINABLE_NETWORK.BSC);

  const refinable = await Refinable.create(wallet, "API_KEY");

  const fileStream = fs.createReadStream(
    path.join(__dirname, "../mint/image.jpg")
  );

  // SDK: Get contract address
  const { refinableContracts } = await refinable.getContracts(["ERC721_TOKEN"]);

  const { contractAddress } = refinableContracts[0] ?? {};

  try {
    // SDK: create an nft
    const nft = await refinable.createNft(TOKEN_TYPE.ERC721, {
      chainId: 97,
      contractAddress,
    });

    console.log("Minting >>>");

    // SDK: mint nft
    await nft.mint(
      {
        file: fileStream,
        description: "some test description",
        name: "the nft 721",
      },
      new StandardRoyaltyStrategy([])
    );

    // SDK: Burn nft
    console.log("Burning >>>");

    await nft.burn();

    console.log("Burning successful");
  } catch (error) {
    console.error(error.response);
  }
}

main();
