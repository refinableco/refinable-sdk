import fs from "fs";
import path from "path";
import {
  Chain,
  Environment,
  initializeWallet,
  RefinableEvmClient,
  TokenType,
} from "../../src";

import { ContractTypes } from "../../src/@types/graphql";

describe("Refinable Create Contract", () => {
  let refinable: RefinableEvmClient;
  const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
  const API_KEY = process.env.API_KEY as string;
  const wallet = initializeWallet(PRIVATE_KEY, Chain.Local);

  wallet.getAddress().then(console.log);

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

  it("should create a new Refinable1155WhitelistedTokenV3", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );

    const collection = {
      title: "Sweet collection",
      description: "Sweet collection description",
      tokenType: TokenType.Erc1155,
      slug: "sweet-collection",
      avatar: fileStream,
    };

    const { tx, contract } = await refinable.contracts.createContract(
      ContractTypes.Erc1155WhitelistedToken,
      "ContracTitle",
      "CONTRACT_SYMBOL",
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
      description: "Sweet collection description",
      tokenType: TokenType.Erc721,
      slug: "sweet-collection",
      avatar: fileStream,
    };

    const { tx, contract } = await refinable.contracts.createContract(
      ContractTypes.Erc721WhitelistedToken,
      "ContracTitle",
      "CONTRACT_SYMBOL",
      collection
    );

    expect(tx).toBeDefined();
    expect(contract).toBeDefined();
  });
});
