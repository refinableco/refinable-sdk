import * as readline from "readline";
import * as fs from "fs";

import { Refinable } from "../Refinable";
import { TOKEN_TYPE } from "../nft/nft";
import { createWallet } from "../providers";
import { REFINABLE_NETWORK } from "../constants/network";
import { erc721TokenAddress } from "../contracts";

const PRIVATE_KEY = "<YOUR PRIVATE KEY>";

type ParameterTuple = [string, number, string, string, number, number];

async function main() {
  const wallet = createWallet(PRIVATE_KEY, REFINABLE_NETWORK.BSC);
  const address = await wallet.getAddress();

  const refinable = Refinable.create(wallet, address, "API_KEY");

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
      await refinable.cancelSale({
        type: TOKEN_TYPE.ERC721,
        contractAddress: erc721TokenAddress,
        tokenId: parameters[1],
      });
      console.log(
        `${erc721TokenAddress}:${parameters[1]} - Canceled from sale`
      );
    }
  });
}

main();
