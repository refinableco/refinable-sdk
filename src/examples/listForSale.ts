import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

import { PriceCurrency } from "../@types/graphql";
import { setupNft } from "./shared";
import { TOKEN_TYPE } from "../nft/nft";
import { StandardRoyaltyStrategy } from "../nft/royaltyStrategies/StandardRoyaltyStrategy";

type ParameterTuple = [string, string, string, string, number, number];

async function main() {
  const fileStream = fs.createReadStream(
    path.join(__dirname, "./mint/image.jpg")
  );

  let lineNumber = 0;
  const rl = readline.createInterface({
    input: fs.createReadStream("./public/listForSale.csv"),
    output: process.stdout,
    terminal: false,
  });

  const nfts: ParameterTuple[] = [];

  rl.on("line", async function (line) {
    lineNumber++;
    if (lineNumber <= 1) {
      return;
    }
    const parameters: ParameterTuple = line.split(",") as ParameterTuple;
    nfts.push(parameters);
  });

  // like this we can process them sync, otherwise blockchain will say we're doing too many txs
  rl.on("close", async function () {
    for (const parameters of nfts) {
      const nft = await setupNft(TOKEN_TYPE.ERC721);

      await nft.mint(
        {
          file: fileStream,
          description: "some test description",
        },
        new StandardRoyaltyStrategy([])
      );
      await nft.putForSale({
        amount: parameters[4],
        currency: parameters[3] as PriceCurrency,
      });
      console.log(
        `{Put ${parameters[5]} items for sale for ${parameters[4]} ${parameters[3]}`
      );
    }
  });
}

main();
