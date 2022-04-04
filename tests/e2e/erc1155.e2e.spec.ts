import { addMinutes } from "date-fns";
import fs from "fs";
import path from "path";
import {
  AbstractNFT,
  Chain,
  Environment,
  ERC1155NFT,
  initializeWallet,
  PriceCurrency,
  RefinableEvmClient,
  SaleOffer,
  StandardRoyaltyStrategy,
} from "../../src";
import { addDays, subDays } from "date-fns";
import {
  LaunchpadCountDownType,
  WhitelistType,
} from "../../src/@types/graphql";
import { sleep } from "../../src/solana/utils";

const createNft = async (refinable: RefinableEvmClient, supply = 5) => {
  const fileStream = fs.createReadStream(
    path.resolve(__dirname, "../assets/image.jpg")
  );
  return await refinable
    .nftBuilder()
    .erc1155({
      nftFile: fileStream,
      description: "some test description",
      name: "The Test NFT",
      royalty: new StandardRoyaltyStrategy([]),
      chainId: Chain.Local,
      supply,
    })
    .createAndMint();
};

describe("ERC1155 - E2E", () => {
  let refinable: RefinableEvmClient;
  let refinable2: RefinableEvmClient;
  const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
  const API_KEY = process.env.API_KEY as string;
  const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2 as string;
  const API_KEY_2 = process.env.API_KEY_2 as string;
  const wallet = initializeWallet(PRIVATE_KEY, Chain.Local);
  const wallet2 = initializeWallet(PRIVATE_KEY_2, Chain.Local);

  beforeAll(async () => {
    refinable = await RefinableEvmClient.create(wallet, API_KEY, {
      waitConfirmations: 1,
      environment: Environment.Local,
    });
    refinable2 = await RefinableEvmClient.create(wallet2, API_KEY_2, {
      waitConfirmations: 1,
      environment: Environment.Local,
    });
  });

  it("should get the current instance", async () => {
    const apiKey = refinable.apiKey;
    expect(apiKey).toBeDefined();
    const currentChainId = await refinable.provider.getChainId();
    expect(currentChainId).toBe(Chain.Local);
  });

  it("should mint a erc1155 token", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );
    const nft = await refinable
      .nftBuilder()
      .erc1155({
        nftFile: fileStream,
        description: "some test description",
        name: "The Test NFT",
        royalty: new StandardRoyaltyStrategy([]),
        chainId: Chain.Local,
        supply: 11,
      })
      .createAndMint();
    const mintedItem = nft.getItem();
    expect(mintedItem.chainId).toEqual(Chain.Local);
    expect(mintedItem.supply).toEqual(11);
    expect(mintedItem.contractAddress).toBeDefined();
  });
  it("Should mint an ERC721 token with video and image", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );
    const videoFileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/video.mp4")
    );
    const nft = await refinable
      .nftBuilder()
      .erc1155({
        nftFile: videoFileStream,
        thumbnailFileStream: fileStream,
        description: "some test description",
        name: "The Test NFT",
        royalty: new StandardRoyaltyStrategy([]),
        chainId: Chain.Local,
        supply: 11,
      })
      .createAndMint();
    const mintedItem = nft.getItem();
    expect(mintedItem.chainId).toEqual(Chain.Local);
    expect(mintedItem.supply).toEqual(11);
    expect(mintedItem.contractAddress).toBeDefined();
  });

  describe("Sale", () => {
    it("should put for sale", async () => {
      const fileStream = fs.createReadStream(
        path.resolve(__dirname, "../assets/image.jpg")
      );
      const address = await wallet.getAddress();
      const nft = await refinable
        .nftBuilder()
        .erc1155({
          nftFile: fileStream,
          description: "some test description",
          name: "The Test NFT",
          royalty: new StandardRoyaltyStrategy([]),
          chainId: Chain.Local,
          supply: 11,
        })
        .createAndMint();
      const price = {
        amount: 1,
        currency: PriceCurrency.Bnb,
      };
      const itemOnSale = await nft.putForSale({
        price,
        supply: 4,
      });
      expect(itemOnSale.totalSupply).toEqual(4);
      expect(itemOnSale.user.ethAddress.toLowerCase()).toEqual(
        address.toLowerCase()
      );
      expect(itemOnSale.type).toEqual("SALE");
      expect(itemOnSale.price).toEqual(price);
    });
    describe("Buy", () => {
      let nft: ERC1155NFT;
      let address: string;
      beforeEach(async () => {
        const fileStream = fs.createReadStream(
          path.resolve(__dirname, "../assets/image.jpg")
        );
        address = await wallet.getAddress();
        nft = await refinable
          .nftBuilder()
          .erc1155({
            nftFile: fileStream,
            description: "some test description",
            name: "The Test NFT",
            royalty: new StandardRoyaltyStrategy([]),
            chainId: Chain.Local,
            supply: 5,
          })
          .createAndMint();
      });
      it("should buy a nft with correct parameters", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };
        const itemOnSale = await nft.putForSale({
          price,
          supply: 2,
        });

        const txnResponse = await itemOnSale.buy(price);
        expect(txnResponse).toBeDefined();
        const txnReceipt = await txnResponse.wait();
        expect(txnReceipt.success).toEqual(true);
      });
    });

    it("should be able to buy multiple at once", async () => {
      const price = {
        amount: 1,
        currency: PriceCurrency.Bnb,
      };

      const nft = await createNft(refinable, 100);

      await sleep(1000);

      const itemOnSale = await nft.putForSale({
        supply: 22,
        price,
      });

      const offer = await refinable2.getOffer(itemOnSale.id);
      const refinable2Nft = refinable2.createNft(nft.getItem());
      const nftOffer: SaleOffer = refinable2.createOffer(
        offer,
        refinable2Nft as AbstractNFT
      );

      const txnResponse = await nftOffer.buy({ amount: 2 });
      expect(txnResponse).toBeDefined();
      const txnReceipt = await txnResponse.wait();
      expect(txnReceipt.success).toEqual(true);
    });

    describe("Whitelist", () => {
      it("should be able to create a whitelisted sale", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };

        const nft = await createNft(refinable);

        const itemOnSale = await nft.putForSale({
          supply: 2,
          price,
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

        const offer = await refinable2.getOffer(itemOnSale.id);

        expect(offer.whitelistStage).toBe(LaunchpadCountDownType.Public);
        expect(offer.whitelistVoucher).toBeNull();

        await itemOnSale.cancelSale();
      });
      it("should not be able to buy when sale has whitelist and user not vip", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };

        const nft = await createNft(refinable);

        const itemOnSale = await nft.putForSale({
          supply: 2,
          price,
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

        const offer = await refinable2.getOffer(itemOnSale.id);
        const refinable2Nft = refinable2.createNft(nft.getItem());
        const nftOffer: SaleOffer = refinable2.createOffer(
          offer,
          refinable2Nft as AbstractNFT
        );

        expect(nftOffer.whitelistStage).toEqual(LaunchpadCountDownType.Public);

        expect(nftOffer.buy()).rejects.toThrowError(
          "reverted with reason string 'You are not whitelisted or public sale has not started"
        );
      });

      it("should be able to buy when sale has whitelist and user not vip but public startDate has come up", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };

        const nft = await createNft(refinable);

        const itemOnSale = await nft.putForSale({
          supply: 2,
          price,
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

        const offer = await refinable2.getOffer(itemOnSale.id);
        const refinable2Nft = refinable2.createNft(nft.getItem());
        const nftOffer: SaleOffer = refinable2.createOffer(
          offer,
          refinable2Nft as AbstractNFT
        );

        expect(nftOffer.whitelistStage).toEqual(LaunchpadCountDownType.Live);

        const txnResponse = await nftOffer.buy();
        expect(txnResponse).toBeDefined();
        const txnReceipt = await txnResponse.wait();
        expect(txnReceipt.success).toEqual(true);
      });

      it("should be able to create a whitelisted sale with user2", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };

        const nft = await createNft(refinable);

        const itemOnSale = await nft.putForSale({
          supply: 2,
          price,
          startTime: addDays(new Date(), 4),
          launchpadDetails: {
            stages: [
              {
                stage: WhitelistType.Vip,
                startTime: subDays(new Date(), 1),
                whitelist: [refinable2.accountAddress.toLowerCase()],
              },
            ],
          },
        });

        const offer = await refinable2.getOffer(itemOnSale.id);

        expect(offer.whitelistStage).toBe(LaunchpadCountDownType.Public);
        expect(offer.whitelistVoucher).not.toBeNull();
      });

      it("should be able to buy a whitelisted item", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };

        const nft = await createNft(refinable);

        const itemOnSale = await nft.putForSale({
          supply: 2,
          price,
          startTime: addDays(new Date(), 4),
          launchpadDetails: {
            stages: [
              {
                stage: WhitelistType.Vip,
                startTime: subDays(new Date(), 1),
                whitelist: [refinable2.accountAddress.toLowerCase()],
              },
            ],
          },
        });

        const offer = await refinable2.getOffer(itemOnSale.id);
        const refinable2Nft = refinable2.createNft(nft.getItem());
        const nftOffer: SaleOffer = refinable2.createOffer(
          offer,
          refinable2Nft as AbstractNFT
        );

        expect(offer.whitelistStage).toBe(LaunchpadCountDownType.Public);
        expect(offer.whitelistVoucher).not.toBeNull();

        const txnResponse = await nftOffer.buy();
        expect(txnResponse).toBeDefined();
        const txnReceipt = await txnResponse.wait();
        expect(txnReceipt.success).toEqual(true);
      });
    });
    describe("Test Cancel", () => {
      let nft: ERC1155NFT;
      let address: string;
      beforeEach(async () => {
        const fileStream = fs.createReadStream(
          path.resolve(__dirname, "../assets/image.jpg")
        );
        address = await wallet.getAddress();
        nft = await refinable
          .nftBuilder()
          .erc1155({
            nftFile: fileStream,
            description: "some test description",
            name: "The Test NFT",
            royalty: new StandardRoyaltyStrategy([]),
            chainId: Chain.Local,
            supply: 5,
          })
          .createAndMint();
      });
      it("should cancel the sale", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };
        const itemOnSale = await nft.putForSale({ price });
        const txnResponse = await itemOnSale.cancelSale();
        expect(txnResponse).toBeDefined();
        const txnReceipt = await txnResponse.wait();
        expect(txnReceipt.success).toEqual(true);
      });
    });
  });

  describe("ERC1155Auction", () => {
    let nft: ERC1155NFT;
    let address: string;
    beforeEach(async () => {
      const fileStream = fs.createReadStream(
        path.resolve(__dirname, "../assets/image.jpg")
      );
      address = await wallet.getAddress();
      nft = await refinable
        .nftBuilder()
        .erc1155({
          nftFile: fileStream,
          description: "some test description",
          name: "The Test NFT",
          supply: 11,
          royalty: new StandardRoyaltyStrategy([]),
          chainId: Chain.Local,
        })
        .createAndMint();
    });
    it("should put on Auction", async (): Promise<void> => {
      const { offer } = await nft.putForAuction({
        auctionStartDate: addMinutes(new Date(), 5),
        auctionEndDate: addMinutes(new Date(), 15),
        price: {
          amount: 1,
          currency: PriceCurrency.Bnb,
        },
      });
      expect(offer).toBeDefined();
      expect(offer.type).toBe("AUCTION");
      expect(offer.user.ethAddress.toLowerCase()).toBe(
        wallet.address.toLowerCase()
      );
      expect(offer.totalSupply).toBe(1);
      expect(offer.auction.id).toBeDefined();
    });
    it("cancel auction", async (): Promise<void> => {
      const { offer } = await nft.putForAuction({
        auctionStartDate: addMinutes(new Date(), 5),
        auctionEndDate: addMinutes(new Date(), 15),
        price: {
          amount: 1,
          currency: PriceCurrency.Bnb,
        },
      });
      const txnResponse = await offer.cancelAuction();
      expect(txnResponse).toBeDefined();
      const txnReceipt = await txnResponse.wait();
      expect(txnReceipt.success).toEqual(true);
    });
    it("end auction should throw error when auction not ended", async (): Promise<void> => {
      try {
        const { offer } = await nft.putForAuction({
          auctionStartDate: addMinutes(new Date(), 5),
          auctionEndDate: addMinutes(new Date(), 15),
          price: {
            amount: 1,
            currency: PriceCurrency.Bnb,
          },
        });
        await offer.endAuction();
      } catch (error) {
        expect(
          error.message.includes("Auction: Auction has not ended")
        ).toBeTruthy();
      }
    });
  });
});
