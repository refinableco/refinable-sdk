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
    const minredItem = nft.getItem();
    expect(minredItem.chainId).toEqual(Chain.Local);
    expect(minredItem.supply).toEqual(11);
    expect(minredItem.contractAddress).toBeDefined();
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
