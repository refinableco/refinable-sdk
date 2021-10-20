import dotenv from "dotenv";
import { Chain, TokenType } from "..";
import { createRefinableClient } from "./shared";
dotenv.config({ path: ".env.testnet" });

async function main() {
  const refinable = await createRefinableClient(Chain.BscTestnet);

  const { contractAddress } = await refinable.contracts.getDefaultTokenContract(
    Chain.BscTestnet,
    TokenType.Erc721
  );

  const nft = await refinable.createNft({
    type: TokenType.Erc721,
    chainId: Chain.BscTestnet,
    contractAddress,
    tokenId: "320",
  });

  await nft.cancelAuction();
}

main();
