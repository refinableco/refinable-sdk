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
import { PutForSaleParams } from "../../src/offer/MintOffer";
import { addDays, subDays } from "date-fns";
import {
  LaunchpadCountDownType,
  WhitelistType,
} from "../../src/@types/graphql";

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

  async function putLazyContractForSale(
    override: Partial<PutForSaleParams> = {}
  ) {
    const mintOffer = await refinableSeller.offer.createMintOffer();

    const fileStream = fs.createReadStream(
      path.join(__dirname, "../assets/image.jpg")
    );

    return await mintOffer.putForSale({
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
      ...override,
      payee: refinableSeller.accountAddress,
    });
  }

  describe("With a MintOffer put for sale", () => {
    let offer: MintOffer;

    beforeEach(async () => {
      // create Mint offer
      //
      offer = await putLazyContractForSale();
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
  });

  describe("Whitelist", () => {
    it("should be able to create a whitelisted sale", async () => {
      const mintOffer = await putLazyContractForSale({
        startTime: addDays(new Date(), 4),
        launchpadDetails: {
          stages: [
            {
              stage: WhitelistType.Vip,
              startTime: subDays(new Date(), 1),
              whitelist: ["0x7633Fe8542c2218B5A25777477F63D395aA5aFB4"],
            },
          ],
        },
      });

      const offer = await refinableBuyer.getOffer(mintOffer.id);

      expect(offer.whitelistStage).toBe(LaunchpadCountDownType.Public);
    });

    it("should not be able to buy when sale has whitelist and user not vip", async () => {
      const mintOffer = await putLazyContractForSale({
        startTime: addDays(new Date(), 4),
        launchpadDetails: {
          stages: [
            {
              stage: WhitelistType.Vip,
              startTime: subDays(new Date(), 1),
              whitelist: ["0x7633Fe8542c2218B5A25777477F63D395aA5aFB4"],
            },
          ],
        },
      });

      const offer = await refinableBuyer.getOffer<MintOffer>(mintOffer.id);

      expect(offer.whitelistStage).toEqual(LaunchpadCountDownType.Public);

      expect(offer.buy()).rejects.toThrowError(
        "reverted with reason string 'Whitelist: You are not whitelisted or public sale has not started"
      );
    });

    it("should be able to buy when sale has whitelist and user not vip but public startDate has come up", async () => {
      const mintOffer = await putLazyContractForSale({
        startTime: subDays(new Date(), 1),
        launchpadDetails: {
          stages: [
            {
              stage: WhitelistType.Vip,
              startTime: subDays(new Date(), 4),
              whitelist: ["0x7633Fe8542c2218B5A25777477F63D395aA5aFB4"],
            },
          ],
        },
      });

      const offer = await refinableBuyer.getOffer<MintOffer>(mintOffer.id);

      expect(offer.whitelistStage).toEqual(LaunchpadCountDownType.Live);

      const txnResponse = await offer.buy();
      expect(txnResponse).toBeDefined();
      const txnReceipt = await txnResponse.wait();
      expect(txnReceipt.success).toEqual(true);
    });

    it("should be able to create a whitelisted sale with user2", async () => {
      const mintOffer = await putLazyContractForSale({
        startTime: addDays(new Date(), 4),
        launchpadDetails: {
          stages: [
            {
              stage: WhitelistType.Vip,
              startTime: subDays(new Date(), 1),
              whitelist: [refinableBuyer.accountAddress.toLowerCase()],
            },
          ],
        },
      });

      const offer = await refinableBuyer.getOffer(mintOffer.id);

      expect(offer.whitelistStage).toBe(LaunchpadCountDownType.Public);
    });

    it("should be able to buy a whitelisted item", async () => {
      const itemOnSale = await putLazyContractForSale({
        startTime: addDays(new Date(), 4),
        launchpadDetails: {
          stages: [
            {
              stage: WhitelistType.Vip,
              startTime: subDays(new Date(), 1),
              whitelist: [refinableBuyer.accountAddress.toLowerCase()],
            },
          ],
        },
      });

      const offer = await refinableBuyer.getOffer<MintOffer>(itemOnSale.id);

      expect(offer.whitelistStage).toBe(LaunchpadCountDownType.Public);

      const txnResponse = await offer.buy();
      expect(txnResponse).toBeDefined();
      const txnReceipt = await txnResponse.wait();
      expect(txnReceipt.success).toEqual(true);
    });
  });
});
