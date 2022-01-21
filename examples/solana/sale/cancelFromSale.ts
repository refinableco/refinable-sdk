import dotenv from "dotenv";
import { createRefinableClientSolana } from "../../shared";
import { Chain, Environment, PriceCurrency } from "../../../src";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

async function main() {
  const refinable = await createRefinableClientSolana(Environment.Testnet);

  const nft = refinable.createNft({
    chainId: Chain.SolanaDevnet,
    contractAddress: TOKEN_PROGRAM_ID.toBase58(),
    // Fill in tokenId that the payer wallet owns
    tokenId: "xiAiDsyX7zBs4YVY6jioB8gW5oipqif6roPGYcBF33c",
  });

  const offer = await nft.putForSale({
    amount: 1,
    currency: PriceCurrency.Sol,
  });

  // Option 1: use the offer object returned by putForSale
  await offer.cancelSale();

  /*
   * Option 2: Manually close sale based on blockchainId
   * --- 
    const blockchainId = offer.blockchainId;
    await nft.cancelSale({ blockchainId });
  */

  console.log("Done putting item on sale");
}

main();
