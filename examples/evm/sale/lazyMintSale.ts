import dotenv from "dotenv";
import {
  Chain,
  Environment,
  initializeWallet,
  PriceCurrency,
  RefinableEvmClient,
} from "../../../src";
import fs from "fs";
import path from "path";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const API_KEY = process.env.API_KEY as string;

async function main() {
  const chainId = Chain.Local;
  const wallet = initializeWallet(PRIVATE_KEY, chainId);
  try {
    // create wallet
    const refinable = await RefinableEvmClient.create(wallet, API_KEY, {
      waitConfirmations: 1,
      environment: Environment.Local,
    });

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
      startTime: new Date(),
      supply: 10000,
      previewImage: fileStream,
      name: "Some test collection",
      description: "Always room for a description",
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
