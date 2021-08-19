import * as dotenv from "dotenv";
dotenv.config();

import { Refinable } from "../../Refinable";
import { TOKEN_TYPE } from "../../nft/nft";
import { createWallet } from "../../providers";
import { REFINABLE_NETWORK } from "../../constants/network";
import { REFINABLE_CURRENCY } from "../../constants/currency";
import * as fs from "fs";
import * as path from "path";
import { StandardRoyaltyStrategy } from "../../nft/royaltyStrategies/StandardRoyaltyStrategy";

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

async function main() {
  const wallet = createWallet(PRIVATE_KEY, REFINABLE_NETWORK.BSC);

  const refinable = Refinable.create(wallet, "API_KEY");

  const fileStream = await fs.createReadStream(
    path.join(__dirname, "image.jpg")
  );

  // SDK: Get contract address
  const { refinableContracts } = await refinable.getContracts([
    "ERC1155_TOKEN",
  ]);

  const { contractAddress } = refinableContracts[0] ?? {};

  // SDK: create an nft
  const nft = await refinable.createNft(TOKEN_TYPE.ERC1155, {
    chainId: 1337,
    contractAddress,
  });

  // SDK: mint nft
  await nft.mint(
    {
      file: fileStream,
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
      currency: REFINABLE_CURRENCY.BNB,
    },
    4
  );
}

main();
