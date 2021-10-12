import * as fs from "fs";
import * as readline from "readline";
import { Chain, TokenType } from "..";
import { createRefinableClient } from "./shared";

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
      // Use and parse existing NFTs to cancel for sale
      const nft = await refinable.createNft({
        type: parameters[2] as TokenType,
        chainId: Chain.BscTestnet,
        contractAddress: parameters[0],
        tokenId: parameters[1],
      });

      await nft.cancelSale();
      console.log(`${parameters[0]}:${parameters[1]} - Canceled from sale`);
    }
  });
}

main();
