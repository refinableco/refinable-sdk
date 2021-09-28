import * as dotenv from "dotenv";
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

  const address = await wallet.getAddress();

  const refinable = await Refinable.create(wallet, "API_KEY");

  const fileStream = await fs.createReadStream(
    path.join(__dirname, "../mint/image.jpg")
  );

  // SDK: Get contract address
  const { refinableContracts } = await refinable.getContracts([
    "ERC1155_TOKEN",
  ]);

  const { contractAddress } = refinableContracts[0] ?? {};

  // SDK: create an nft
  try {
    const nft = await refinable.createNft(TOKEN_TYPE.ERC1155, {
      chainId: 97,
      contractAddress,
    });

    console.log("minting >>>");

    // SDK: mint nft
    await nft.mint(
      {
        file: fileStream,
        description: "some test description",
        name: "The NFT 1155",
        supply: 5,
      },
      new StandardRoyaltyStrategy([])
    );

    console.log("burning >>>");

    // SDK: burn item
    await nft.burn(address, 5);

    console.log("burning successful!");
  } catch (error) {
    console.error(error);
  }
}

main();
