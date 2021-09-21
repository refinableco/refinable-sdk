import dotenv from "dotenv";
dotenv.config({ path: ".env.testnet" });

import { Refinable } from "../Refinable";
import { TOKEN_TYPE } from "../nft/nft";
import { createWallet } from "../providers";
import { REFINABLE_NETWORK } from "../constants/network";
import * as fs from "fs";
import * as path from "path";
import { StandardRoyaltyStrategy } from "../nft/royaltyStrategies/StandardRoyaltyStrategy";
import { PriceCurrency } from "../@types/graphql";
import { Chain } from "../interfaces/Network";

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

async function main() {
  const wallet = createWallet(PRIVATE_KEY, REFINABLE_NETWORK.BSC);

  const refinable = await Refinable.create(wallet, "API_KEY", {
    waitConfirmations: 1,
  });

  const fileStream = await fs.createReadStream(
    path.join(__dirname, "mint/image.jpg")
  );

  // SDK: Get contract address
  const { refinableContracts } = await refinable.getContracts(["ERC721_TOKEN"]);

  const { contractAddress } = refinableContracts[0] ?? {};

  // SDK: create an nft
  const nft = await refinable.createNft(TOKEN_TYPE.ERC721, {
    chainId: Chain.BscTestnet,
    contractAddress: "0x9f69a6cbe17d26d86df0fc216bf632083a02a135",
  });

  // SDK: mint nft
  console.log("...minting");
  await nft.mint(
    {
      file: fileStream,
      description: "some test description",
      name: "The Auction Test NFT721",
    },
    new StandardRoyaltyStrategy([])
  );

  // SDK: Put for sale
  console.log("...putting for auction");
  await nft.putForAuction({
    auctionStartDate: new Date(Date.now() + 300000),
    auctionEndDate: new Date(Date.now() + 900000),
    price: {
      amount: 1,
      currency: PriceCurrency.Bnb,
    },
  });
}

main();
