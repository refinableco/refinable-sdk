import * as dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import * as readline from "readline";
import * as fs from "fs";

import { Refinable } from "../Refinable";
import { TOKEN_TYPE } from "../nft/nft";
import { createWallet } from "../providers";
import { REFINABLE_NETWORK } from "../constants/network";
import { PriceCurrency } from "../@types/graphql";
import { Chain } from "../interfaces/Network";

const PRIVATE_KEY = "<YOUR PRIVATE KEY>";

type ParameterTuple = [string, number, string, string, number, number];

async function main() {
  const wallet = createWallet(PRIVATE_KEY, REFINABLE_NETWORK.BSC);

  const refinable = await Refinable.create(wallet, "API_KEY");

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
      const nft = await refinable.createNft(TOKEN_TYPE.ERC721, {
        chainId: Chain.BscMainnet,
        contractAddress: parameters[0],
        tokenId: parameters[1],
      });

      await nft.putForSale({
        amount: parameters[4],
        currency: parameters[3] as PriceCurrency,
      });
      console.log(
        `${parameters[0]}:${parameters[1]} - Put ${parameters[5]} for sale for ${parameters[4]} ${parameters[3]}`
      );
    }
  });
}

main();
