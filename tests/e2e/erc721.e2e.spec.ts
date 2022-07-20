import { addDays, subDays } from "date-fns";
import fs from "fs";
import path from "path";
import {
  Chain,
  Environment,
  ERC721NFT,
  initializeWallet,
  NotEnoughSupplyError,
  PriceCurrency,
  Refinable,
  SaleOffer,
  StandardRoyaltyStrategy,
} from "../../src";
import {
  LaunchpadCountDownType,
  WhitelistType,
} from "../../src/@types/graphql";
import { ClientType } from "../../src/refinable/Refinable";

const createNft = async (refinable: Refinable) => {
  const fileStream = fs.createReadStream(
    path.resolve(__dirname, "../assets/image.jpg")
  );
  return await refinable.evm
    .nftBuilder()
    .erc721({
      nftFile: fileStream,
      description: "some test description",
      name: "The Test NFT",
      royalty: new StandardRoyaltyStrategy([]),
      chainId: Chain.Local,
    })
    .createAndMint();
};

describe("ERC721 - E2E", () => {
  let refinable: Refinable;
  let refinable2: Refinable;
  const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
  const API_KEY = process.env.API_KEY as string;
  const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2 as string;
  const API_KEY_2 = process.env.API_KEY_2 as string;
  const wallet = initializeWallet(PRIVATE_KEY, Chain.Local);
  const wallet2 = initializeWallet(PRIVATE_KEY_2, Chain.Local);

  beforeAll(async () => {
    refinable = await Refinable.create(API_KEY, {
      environment: Environment.Local,
      evm: {
        waitConfirmations: 1,
      },
    });

    await refinable.connect(ClientType.Evm, wallet);

    refinable2 = await Refinable.create(API_KEY_2, {
      environment: Environment.Local,
      evm: {
        waitConfirmations: 1,
      },
    });

    await refinable2.connect(ClientType.Evm, wallet2);
  });

  it("should get the current instance", async () => {
    const currentChainId = await refinable.provider.getChainId();
    expect(currentChainId).toBe(Chain.Local);
  });

  it("should mint a erc721 token", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );
    const nft = await refinable.evm
      .nftBuilder()
      .erc721({
        nftFile: fileStream,
        description: "some test description",
        name: "The Test NFT",
        royalty: new StandardRoyaltyStrategy([]),
        chainId: Chain.Local,
      })
      .createAndMint();
    const mintedItem = nft.getItem();
    expect(mintedItem.chainId).toEqual(Chain.Local);
    expect(mintedItem.supply).toEqual(1);
    expect(mintedItem.contractAddress).toBeDefined();
  });
  it("Should mint an ERC721 token with video and image", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );
    const videoFileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/video.mp4")
    );
    const nft = await refinable.evm
      .nftBuilder()
      .erc721({
        nftFile: videoFileStream,
        thumbnailFileStream: fileStream,
        description: "some test description",
        name: "The Test NFT",
        royalty: new StandardRoyaltyStrategy([]),
        chainId: Chain.Local,
      })
      .createAndMint();
    const mintedItem = nft.getItem();
    expect(mintedItem.chainId).toEqual(Chain.Local);
    expect(mintedItem.supply).toEqual(1);
    expect(mintedItem.contractAddress).toBeDefined();
  });
  describe("Sale", () => {
    it("Should be able put for sale", async () => {
      const fileStream = fs.createReadStream(
        path.resolve(__dirname, "../assets/image.jpg")
      );
      const address = await wallet.getAddress();
      const nft = await refinable.evm
        .nftBuilder()
        .erc721({
          nftFile: fileStream,
          description: "some test description",
          name: "The Test NFT",
          royalty: new StandardRoyaltyStrategy([]),
          chainId: Chain.Local,
        })
        .createAndMint();
      const price = {
        amount: 1,
        currency: PriceCurrency.Bnb,
      };
      const itemOnSale = await nft.putForSale({ price });
      expect(itemOnSale.totalSupply).toEqual(1);
      expect(itemOnSale.seller?.ethAddress?.toLowerCase()).toEqual(
        address.toLowerCase()
      );
      expect(itemOnSale.type).toEqual("SALE");
      expect(itemOnSale.price).toEqual(price);
    });
    describe("Buy", () => {
      let nft: ERC721NFT;
      let address: string;
      beforeEach(async () => {
        const fileStream = fs.createReadStream(
          path.resolve(__dirname, "../assets/image.jpg")
        );
        address = await wallet.getAddress();
        nft = await refinable.evm
          .nftBuilder()
          .erc721({
            nftFile: fileStream,
            description: "some test description",
            name: "The Test NFT",
            royalty: new StandardRoyaltyStrategy([]),
            chainId: Chain.Local,
          })
          .createAndMint();
      });
      it("should buy a nft with correct parameters", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };
        const itemOnSale = await nft.putForSale({ price });

        const offer = await refinable2.offer.getOffer<SaleOffer>(itemOnSale.id);
        const txnResponse = await offer.buy(price);
        expect(txnResponse).toBeDefined();
        const txnReceipt = await txnResponse.wait();
        expect(txnReceipt.success).toEqual(true);
      });

      it("should throw error when trying to buy same item without refetching offer", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };
        const itemOnSale = await nft.putForSale({ price });

        const offer = await refinable2.offer.getOffer<SaleOffer>(itemOnSale.id);
        const txnResponse = await offer.buy(price);
        const txnReceipt = await txnResponse.wait();
        expect(txnReceipt.success).toEqual(true);

        await expect(offer.buy(price)).rejects.toThrowError(
          NotEnoughSupplyError
        );
      });
    });

    describe("Whitelist", () => {
      it("should be able to create a whitelisted sale", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };

        const nft = await createNft(refinable);

        const itemOnSale = await nft.putForSale({
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

        const offer = await refinable2.offer.getOffer(itemOnSale.id);

        expect(offer.whitelistStage).toBe(LaunchpadCountDownType.Public);

        await itemOnSale.cancelSale();
      });
      it("should not be able to buy when sale has whitelist and user not vip", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };

        const nft = await createNft(refinable);

        const itemOnSale = await nft.putForSale({
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

        const offer = await refinable2.offer.getOffer<SaleOffer>(itemOnSale.id);

        expect(offer.whitelistStage).toEqual(LaunchpadCountDownType.Public);

        expect(offer.buy()).rejects.toThrowError(
          "reverted with reason string 'Whitelist: You are not whitelisted or public sale has not started"
        );
      });

      it("should be able to buy when sale has whitelist and user not vip but public startDate has come up", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };

        const nft = await createNft(refinable);

        const itemOnSale = await nft.putForSale({
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

        const offer = await refinable2.offer.getOffer<SaleOffer>(itemOnSale.id);

        expect(offer.whitelistStage).toEqual(LaunchpadCountDownType.Live);

        const txnResponse = await offer.buy();
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

        const offer = await refinable2.offer.getOffer(itemOnSale.id);

        expect(offer.whitelistStage).toBe(LaunchpadCountDownType.Public);
      });

      it("should be able to buy a whitelisted item", async () => {
        const price = {
          amount: 1,
          currency: PriceCurrency.Bnb,
        };

        const nft = await createNft(refinable);

        const itemOnSale = await nft.putForSale({
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

        const offer = await refinable2.offer.getOffer<SaleOffer>(itemOnSale.id);

        expect(offer.whitelistStage).toBe(LaunchpadCountDownType.Public);

        const txnResponse = await offer.buy();
        expect(txnResponse).toBeDefined();
        const txnReceipt = await txnResponse.wait();
        expect(txnReceipt.success).toEqual(true);
      });
    });
    describe("Cancel", () => {
      let nft: ERC721NFT;
      let address: string;
      beforeEach(async () => {
        const fileStream = fs.createReadStream(
          path.resolve(__dirname, "../assets/image.jpg")
        );
        address = await wallet.getAddress();
        nft = await refinable.evm
          .nftBuilder()
          .erc721({
            nftFile: fileStream,
            description: "some test description",
            name: "The Test NFT",
            royalty: new StandardRoyaltyStrategy([]),
            chainId: Chain.Local,
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
  describe("Auction", () => {
    let nft: ERC721NFT;
    let address: string;
    beforeEach(async () => {
      const fileStream = fs.createReadStream(
        path.resolve(__dirname, "../assets/image.jpg")
      );
      address = await wallet.getAddress();
      nft = await refinable.evm
        .nftBuilder()
        .erc721({
          nftFile: fileStream,
          description: "some test description",
          name: "The Test NFT",
          royalty: new StandardRoyaltyStrategy([]),
          chainId: Chain.Local,
        })
        .createAndMint();
    });
    it("should put on Auction", async (): Promise<void> => {
      const { offer } = await nft.putForAuction({
        auctionStartDate: new Date(Date.now() + 300000),
        auctionEndDate: new Date(Date.now() + 900000),
        price: {
          amount: 1,
          currency: PriceCurrency.Bnb,
        },
      });
      expect(offer).toBeDefined();
      expect(offer.type).toBe("AUCTION");
      expect(offer.seller?.ethAddress?.toLowerCase()).toBe(
        wallet.address.toLowerCase()
      );
      expect(offer.totalSupply).toBe(1);
    });
    it("cancel auction", async (): Promise<void> => {
      const { offer } = await nft.putForAuction({
        auctionStartDate: new Date(Date.now() + 300000),
        auctionEndDate: new Date(Date.now() + 600000),
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
    it("end auction should throw error ending while auction has not ended", async (): Promise<void> => {
      const { offer } = await nft.putForAuction({
        auctionStartDate: new Date(Date.now() + 300000),
        auctionEndDate: new Date(Date.now() + 600000),
        price: {
          amount: 1,
          currency: PriceCurrency.Bnb,
        },
      });

      await expect(offer.endAuction()).rejects.toThrow(
        "Auction: Auction has not ended"
      );
    });
  });
});
