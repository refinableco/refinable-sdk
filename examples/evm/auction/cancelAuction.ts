import dotenv from "dotenv";
import { Chain, TokenType } from "../../../lib";
import { PriceCurrency } from "../../../src";
import { createRefinableClient } from "../../shared";
dotenv.config({ path: ".env.testnet" });

async function main() {
  const refinable = await createRefinableClient(Chain.BscTestnet);

  const { contractAddress } = await refinable.contracts.getDefaultTokenContract(
    Chain.BscTestnet,
    TokenType.Erc721
  );

  const nft = refinable.createNft({
    type: TokenType.Erc721,
    chainId: Chain.BscTestnet,
    contractAddress,
    tokenId: "320",
  });

  const { offer } = await nft.putForAuction({
    auctionStartDate: new Date(Date.now() + 300000),
    auctionEndDate: new Date(Date.now() + 900000),
    price: {
      amount: 1,
      currency: PriceCurrency.Bnb,
    },
  });

  await offer.cancelAuction();
}

main();
