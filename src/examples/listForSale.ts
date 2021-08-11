import * as readline from "readline";
import * as fs from "fs";

import { Refinable } from "../Refinable";
import { REFINABLE_CURRENCY } from "../constants/currency";
import { TOKEN_TYPE } from "../nft/nft";
import { createWallet } from "../providers";
import { REFINABLE_NETWORK } from "../constants/network";
import { erc721TokenAddress } from "../contracts";

const PRIVATE_KEY = "<YOUR PRIVATE KEY>";

type ParameterTuple = [string, number, string, string, number, number];

async function main() {
  const wallet = createWallet(PRIVATE_KEY, REFINABLE_NETWORK.BSC_MAINNET);
  const address = await wallet.getAddress();

  const refinable = Refinable.create(wallet, address, "API_KEY");

  let lineNumber = 0;
  const rl = readline.createInterface({
    input: fs.createReadStream("./public/listForSale.csv"),
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", async function (line) {
    lineNumber++;
    if (lineNumber <= 1) {
      return;
    }

    const parameters: ParameterTuple = line.split(",") as ParameterTuple;

    await refinable.putForSale({
      type: TOKEN_TYPE.ERC721,
      contractAddress: erc721TokenAddress,
      tokenId: parameters[1],
      amount: parameters[4],
      supply: parameters[5],
      currency: parameters[3] as REFINABLE_CURRENCY,
    });
  });
}

main();
