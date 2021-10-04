import { TOKEN_TYPE } from "../../nft/nft";
import { setupNft } from "../shared";

async function main() {
  try {
    // SDK: create an nft
    const nft = await setupNft(TOKEN_TYPE.ERC721);
    console.log("Getting items for sale");
    await nft.getItemsOnSale(5);
    console.log("items fetched ✅");
  } catch (error) {
    console.error(error);
  }
}

main();
