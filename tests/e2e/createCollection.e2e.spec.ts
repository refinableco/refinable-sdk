import fs from "fs";
import path from "path";
import {
  Chain,
  Environment,
  initializeWallet,
  Refinable,
  TokenType,
} from "../../src";
import { ClientType } from "../../src/refinable/Refinable";

describe("Refinable Create Contract", () => {
  let refinable: Refinable;
  const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
  const API_KEY = process.env.API_KEY as string;
  const wallet = initializeWallet(PRIVATE_KEY, Chain.Local);

  wallet.getAddress().then(console.log);

  beforeAll(async () => {
    refinable = await Refinable.create(API_KEY, {
      environment: Environment.Local,
      evm: {
        waitConfirmations: 1,
      },
    });

    await refinable.connect(ClientType.Evm, wallet);
  });

  it("should get the current instance", async () => {
    const currentChainId = await refinable.provider.getChainId();
    expect(currentChainId).toBe(Chain.Local);
  });

  it("should create a new Refinable1155WhitelistedTokenV3", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );

    const collection = {
      title: "Sweet collection",
      symbol: "CONTRACT_SYMBOL",
      description: "Sweet collection description",
      tokenType: TokenType.Erc1155,
      slug: `sweet-collection${new Date().toISOString()}`,
      avatar: fileStream,
    };

    const { tx, contract } = await refinable.evm.contracts.createCollection(
      collection
    );

    expect(tx).toBeDefined();
    expect(contract).toBeDefined();
  });

  it("should create a new Refinable721WhitelistedTokenV3", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );

    const collection = {
      title: "Sweet collection",
      symbol: "CONTRACT_SYMBOL",
      description: "Sweet collection description",
      tokenType: TokenType.Erc721,
      slug: `sweet-collection${new Date().toISOString()}`,
      avatar: fileStream,
    };

    const { tx, contract } = await refinable.evm.contracts.createCollection(
      collection
    );

    expect(tx).toBeDefined();
    expect(contract).toBeDefined();
  });

  it("should throw for duplicated coll slug", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );

    const slug = `sweet-collection${new Date().toISOString()}`;
    const collection = {
      title: "Sweet collection",
      symbol: "CONTRACT_SYMBOL",
      description: "Sweet collection description",
      tokenType: TokenType.Erc721,
      slug,
      avatar: fileStream,
    };

    await refinable.evm.contracts.createCollection(collection);

    await new Promise((res) => setTimeout(res, 2000));
    expect(await refinable.evm.contracts.createCollection(collection)).toThrow(
      /slug is duplicated/
    );
  });
});
