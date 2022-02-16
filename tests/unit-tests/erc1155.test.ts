import fs from "fs";
import path from "path";
import {
  Chain,
  Environment,
  ERC1155NFT,
  initializeWallet,
  PriceCurrency,
  Refinable,
  StandardRoyaltyStrategy,
} from "../../src";

describe("Refinable", () => {
  let refinable: Refinable;
  const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
  const API_KEY = process.env.API_KEY as string;
  const wallet = initializeWallet(PRIVATE_KEY, Chain.Local);
  beforeAll(async () => {
    refinable = await Refinable.create(wallet, API_KEY, {
      waitConfirmations: 1,
      environment: Environment.Local,
    });
  });
  it("should set correct env variables", async () => {
    expect(API_KEY).toBeDefined();
    expect(PRIVATE_KEY).toBeDefined();
  });

  it("should get the current instance", async () => {
    const apiKey = refinable.apiKey;
    expect(apiKey).toBeDefined();
    const currentChainId = await refinable.provider.getChainId();
    expect(currentChainId).toBe(Chain.Local);
  });

  describe("ERC1155Sale", () => {
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
      expect(mintedItem.supply).toEqual(1);
      expect(mintedItem.contractAddress).toBeDefined();
    });
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
      const itemOnSale = await nft.putForSale(price, 4);
      expect(itemOnSale.totalSupply).toEqual(4);
      expect(itemOnSale.user.ethAddress.toLowerCase()).toEqual(
        address.toLowerCase()
      );
      expect(itemOnSale.type).toEqual("SALE");
      expect(itemOnSale.price).toEqual(price);
    });
    describe("Test Buy", () => {
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
        const itemOnSale = await nft.putForSale(price, 2);
        const txnResponce = await itemOnSale.buy(price);
        expect(txnResponce).toBeDefined();
        expect(txnResponce.chainId).toEqual(Chain.Local);
        expect(txnResponce.from).toEqual(address);

        const txnReceipt = await txnResponce.wait();
        expect(txnReceipt.confirmations).toBe(1);
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
        const itemOnSale = await nft.putForSale(price);
        const txnResponce = await itemOnSale.cancelSale();
        expect(txnResponce).toBeDefined();
        expect(txnResponce.chainId).toEqual(Chain.Local);
        expect(txnResponce.from).toEqual(address);
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
        auctionStartDate: new Date(Date.now() + 300000),
        auctionEndDate: new Date(Date.now() + 900000),
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
        auctionStartDate: new Date(Date.now() + 300000),
        auctionEndDate: new Date(Date.now() + 600000),
        price: {
          amount: 1,
          currency: PriceCurrency.Bnb,
        },
      });
      const res = await (await offer.cancelAuction()).wait(1);
      expect(res).toBeDefined();
      expect(res.confirmations).toBe(1);
    });
    it("end auction should throw error while there are no bids", async (): Promise<void> => {
      try {
        const { offer } = await nft.putForAuction({
          auctionStartDate: new Date(Date.now() + 300000),
          auctionEndDate: new Date(Date.now() + 600000),
          price: {
            amount: 1,
            currency: PriceCurrency.Bnb,
          },
        });
        await offer.endAuction();
      } catch (error) {
        expect(
          error.message.includes(
            "VM Exception while processing transaction: revert ERC1155Auction: There is no bid"
          )
        ).toBeTruthy();
      }
    });
  });
});
