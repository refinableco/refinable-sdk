import fs from "fs";
import path from "path";
import { Chain, PriceCurrency, TokenType } from "../../src";
import { createRefinableClient } from "../shared";

async function main() {
  try {
    // create wallet
    const refinable = await createRefinableClient(Chain.PolygonTestnet);

    const fileStream = fs.createReadStream(
      path.join(__dirname, "../mint/image.jpg")
    );

    const contract =
      await refinable.evm.contractFactory.createLazyTokenContract(
        TokenType.Erc721,
        {
          avatar: fileStream,
          name: "ARTFT Mint Pass",
          description:
            "ARTFT, powered by CASETiFY, empowers brands and creators across entertainment, fashion and art to create metaverse-ready digital collectibles that allow fans to participate in the world of their favourite fandoms. Leveraging the world's biggest tech & lifestyle brand, we aim to bring talent, scale, and production to the metaverse.",
          symbol: "ARTFTPASS",
          contractArguments: {
            royalties: {
              account: "0x7940A93584E12bce85a63b74dd03Abe86Fa67cbd",
              value: 1000,
            },
            placeholderTokenURI: "",
            tokenMintLimit: 1000,
            saleSettings: {
              maxPerMint: 1,
              maxPerWallet: 1,
            },
          },
        }
      );

    // create Mint offer
    //
    const fileStream = fs.createReadStream(
      path.join(__dirname, "../mint/image.jpg")
    );

    const mintOffer = await refinable.offer.createMintOffer();
    const offer = await mintOffer.putForSale({
      contractAddress: contract.contract.contractAddress,
      price: {
        amount: 0.1,
        currency: PriceCurrency.Eth,
      },
      startTime: new Date(),
      supply: 1000,
      // TODO: video
      previewFile: fileStream,
      name: "ARTFT Mint Pass",
      description:
        "ARTFT, powered by CASETiFY, empowers brands and creators across entertainment, fashion and art to create metaverse-ready digital collectibles that allow fans to participate in the world of their favourite fandoms. Leveraging the world's biggest tech & lifestyle brand, we aim to bring talent, scale, and production to the metaverse.",

      payee: "0x7940A93584E12bce85a63b74dd03Abe86Fa67cbd",
    });

    // Create checkout
    const response = await refinable.checkout.create({
      offerId: offer.id,
    });

    console.log(response.url);
  } catch (error) {
    console.error(error);
  }
}

main();
