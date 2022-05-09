import fs from "fs";
import path from "path";
import {
  Chain,
  Environment,
  initializeWallet,
  MintOffer,
  PriceCurrency,
  RefinableEvmClient,
} from "../../src";
import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

describe("MintOffer - E2E", () => {
  let refinableSeller: RefinableEvmClient; // the refinable sdk instance for a seller
  let refinableBuyer: RefinableEvmClient; // the refinable sdk instance for a buyer

  const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
  const API_KEY = process.env.API_KEY as string;
  const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2 as string;
  const API_KEY_2 = process.env.API_KEY_2 as string;

  const wallet = initializeWallet(PRIVATE_KEY, Chain.Local);
  const wallet2 = initializeWallet(PRIVATE_KEY_2, Chain.Local);

  beforeAll(async () => {
    refinableSeller = await RefinableEvmClient.create(wallet, API_KEY, {
      waitConfirmations: 1,
      environment: Environment.Local,
    });
    refinableBuyer = await RefinableEvmClient.create(wallet2, API_KEY_2, {
      waitConfirmations: 1,
      environment: Environment.Local,
    });
  });

  describe("With a MintOffer put for sale", () => {
    let offer: MintOffer;

    beforeEach(async () => {
      // create Mint offer
      //
      const fileStream = fs.createReadStream(
        path.join(__dirname, "../assets/image.jpg")
      );

      const mintOffer = await refinableSeller.offer.createMintOffer();
      offer = await mintOffer.putForSale({
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
    });

    it("Allows a buyer to purchase 1 NFT from a lazy-mintable collection", async () => {
      const mintOffer = await refinableBuyer.getOffer<MintOffer>(offer.id);

      const txnResponse = await mintOffer.buy({
        amount: 1,
      });

      expect(txnResponse).toBeDefined();
      const txnReceipt = await txnResponse.wait();
      expect(txnReceipt.success).toEqual(true);
    });

    it("Allows a buyer to purchase multiple NFTs from a lazy-mintable collection", async () => {
      const mintOffer = await refinableBuyer.getOffer<MintOffer>(offer.id);

      const txnResponse = await mintOffer.buy({
        amount: 2,
      });

      expect(txnResponse).toBeDefined();
      const txnReceipt = await txnResponse.wait();
      expect(txnReceipt.success).toEqual(true);
    });

    it("Fails when a buyer tries to purchase more than the allowed amount of nfts", async () => {
      const mintOffer = await refinableBuyer.getOffer<MintOffer>(offer.id);

      try {
        await mintOffer.buy({
          amount: 4,
        });
      } catch (ex) {
        expect(ex.message).toContain("ERC721Lazy: Buyer limit reached");
      }
    });
  });
});
