import * as dotenv from "dotenv";
import * as fs from "fs";
import * as readline from "readline";
import { Chain, EvmTokenType, PriceCurrency } from "../../../src";
import { createRefinableClient } from "../../shared";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

type ParameterTuple = [string, string, string, string, number, number];

async function main() {
  const refinable = await createRefinableClient(Chain.BscTestnet);

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
      // Use and parse existing NFTs to put for sale
      const nft = refinable.createNft({
        type: parameters[2] as EvmTokenType,
        chainId: Chain.BscTestnet,
        contractAddress: parameters[0],
        tokenId: parameters[1],
      });

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
