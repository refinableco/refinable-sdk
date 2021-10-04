import dotenv from "dotenv";
dotenv.config({ path: ".env.testnet" });

import { TOKEN_TYPE } from "../nft/nft";
import { setupNft } from "./shared";

async function main() {
  const nft = await setupNft(TOKEN_TYPE.ERC721);
  nft.setItem({
    ...nft.getItem(),
    tokenId: "320",
  });

  const auctionId = await nft.getAuctionId();
  await nft.endAuction(auctionId);
}

main();
