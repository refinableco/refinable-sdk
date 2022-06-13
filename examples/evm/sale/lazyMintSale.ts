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
        amount: 0.08,
        currency: PriceCurrency.Bnb,
      },
      startTime: new Date(),
      supply: 100,
      previewImage: fileStream,
      name: "Some test collection",
      description: "Always room for a description",
      payee: "0x4c3Da80eAEc19399Bc4ce3486ec58755a875d645",
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
