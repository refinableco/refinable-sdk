import fs from "fs";
import path from "path";
import {
  Chain,
  Environment,
  ERC721NFT,
  initializeWallet,
  PriceCurrency,
  RefinableEvmClient,
  StandardRoyaltyStrategy,
} from "../../src";

describe("Refinable", () => {
  let refinable: RefinableEvmClient;
  const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
  const API_KEY = process.env.API_KEY as string;
  const wallet = initializeWallet(PRIVATE_KEY, Chain.Local);
  beforeAll(async () => {
    refinable = await RefinableEvmClient.create(wallet, API_KEY, {
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

  it("should mint a erc721 token", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );
    const nft = await refinable
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
  it("should put for sale", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );
    const address = await wallet.getAddress();
    const nft = await refinable
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
    const itemOnSale = await nft.putForSale(price);
    expect(itemOnSale.totalSupply).toEqual(1);
    expect(itemOnSale.user.ethAddress.toLowerCase()).toEqual(
      address.toLowerCase()
    );
    expect(itemOnSale.type).toEqual("SALE");
    expect(itemOnSale.price).toEqual(price);
  });
  describe("ERC721Sale", () => {
    describe("Test Buy", () => {
      let nft: ERC721NFT;
      let address: string;
      beforeEach(async () => {
        const fileStream = fs.createReadStream(
          path.resolve(__dirname, "../assets/image.jpg")
        );
        address = await wallet.getAddress();
        nft = await refinable
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
        const itemOnSale = await nft.putForSale(price);
        const txnResponse = await itemOnSale.buy(price);
        expect(txnResponse).toBeDefined();
        const txnReceipt = await txnResponse.wait();
        expect(txnReceipt.success).toEqual(true);
      });
    });
    describe("Test Cancel", () => {
      let nft: ERC721NFT;
      let address: string;
      beforeEach(async () => {
        const fileStream = fs.createReadStream(
          path.resolve(__dirname, "../assets/image.jpg")
        );
        address = await wallet.getAddress();
        nft = await refinable
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
        const itemOnSale = await nft.putForSale(price);
        const txnResponse = await itemOnSale.cancelSale();
        expect(txnResponse).toBeDefined();
        const txnReceipt = await txnResponse.wait();
        expect(txnReceipt.success).toEqual(true);
      });
    });
  });
  describe("ERC721Auction", () => {
    let nft: ERC721NFT;
    let address: string;
    beforeEach(async () => {
      const fileStream = fs.createReadStream(
        path.resolve(__dirname, "../assets/image.jpg")
      );
      address = await wallet.getAddress();
      nft = await refinable
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
      expect(offer.user.ethAddress.toLowerCase()).toBe(
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
            "VM Exception while processing transaction: revert ERC721Auction: There is no bid"
          )
        ).toBeTruthy();
      }
    });
  });
});
