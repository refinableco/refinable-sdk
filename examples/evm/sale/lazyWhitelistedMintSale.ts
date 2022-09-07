import { addDays } from "date-fns";
import fs from "fs";
import path from "path";
import { Chain, PriceCurrency } from "../../../src";
import { createRefinableClient } from "../../shared";

async function main() {
  const chainId = Chain.Local;
  try {
    // create wallet
    const refinable = await createRefinableClient(chainId);

    // create Mint offer
    //
    const fileStream = fs.createReadStream(
      path.join(__dirname, "../mint/image.jpg")
    );

    const mintOffer = await refinable.offer.createMintOffer();
    const offer = await mintOffer.putForSale({
      contractAddress: "0x898de23b24C7C2189488079a6871C711Dd125504",
      price: {
        amount: 0.18,
        currency: PriceCurrency.Bnb,
      },
      startTime: addDays(new Date(), 1),
      supply: 10000,
      previewFile: fileStream,
      name: "Some test collection",
      description: "Always room for a description",
      launchpadDetails: {
        stages: [
          {
            stage: "VIP" as any,
            startTime: new Date(),
            price: 0.1,
            whitelist: ["0xd4039eb67cbb36429ad9dd30187b94f6a5122215"],
          },
        ],
      },
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
