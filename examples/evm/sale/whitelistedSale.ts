import * as dotenv from "dotenv";
import { Chain, PriceCurrency, StandardRoyaltyStrategy } from "../../../src";
import { createRefinableClient } from "../../shared";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

async function main() {
  const fileStream = fs.createReadStream(
    path.join(__dirname, "../../../tests/assets/image.jpg")
  );

  const chainInfo = {
    chain: Chain.Local,
    currency: PriceCurrency.Bnb,
    contractAddress: "0x76de4e88fb130c9eb6e0be00891cb378e2eb2155",
  };

  const refinable = await createRefinableClient(chainInfo.chain);

  const nft = await refinable.evm
    .nftBuilder()
    .erc1155({
      contractAddress: chainInfo.contractAddress, // bsc testnet
      nftFile: fileStream,
      description: "A test whitelist NFT",
      name: "Test whitelist",
      chainId: chainInfo.chain,
      supply: 10,
      royalty: new StandardRoyaltyStrategy([]),
    })
    .createAndMint();

  await nft.putForSale({
    price: {
      amount: 0.2,
      currency: chainInfo.currency,
    },
    startTime: new Date("Apr 30 2022 00:00:00 GMT"),
    supply: nft.getItem().supply,
    launchpadDetails: {
      stages: [
        {
          stage: "VIP" as any,
          startTime: new Date("Apr 20 2022 00:00:00 GMT"),
          price: 0.1,
          whitelist: ["0xd4039eb67cbb36429ad9dd30187b94f6a5122215"],
        },
      ],
    },
  });

  const response = await refinable.checkout.create({
    contractAddress: chainInfo.contractAddress,
    tokenId: "12",
    chainId: chainInfo.chain,
    userEthAddress: refinable.accountAddress,
  });

  console.log(response);
}

main();
