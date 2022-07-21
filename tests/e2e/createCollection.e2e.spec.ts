import fs from "fs";
import path from "path";
import {
  Chain,
  ContractTypes,
  Environment,
  initializeWallet,
  Refinable,
  TokenType,
} from "../../src";
import { Erc721WhitelistContract } from "../../src/refinable/contract/Erc721WhitelistContract";
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

    const { tx, contract } =
      await refinable.evm.contractFactory.createWhitelistContract(
        TokenType.Erc1155,
        {
          name: "Sweet collection",
          symbol: "CONTRACT_SYMBOL",
          description: "Sweet collection description",
          avatar: fileStream,
          contractArguments: {},
        }
      );

    expect(tx).toBeDefined();
    expect(contract).toBeDefined();
  });

  it("should create a new Refinable721WhitelistedTokenV3", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );

    const { tx, contract } =
      await refinable.evm.contractFactory.createWhitelistContract(
        TokenType.Erc721,
        {
          name: "Sweet collection",
          symbol: "CONTRACT_SYMBOL",
          description: "Sweet collection description",
          avatar: fileStream,
          contractArguments: {},
        }
      );

    expect(tx).toBeDefined();
    expect(contract).toBeDefined();
  });

  it("should create a new 721LazyMintToken", async () => {
    const fileStream = fs.createReadStream(
      path.resolve(__dirname, "../assets/image.jpg")
    );

    const { tx, contract } =
      await refinable.evm.contractFactory.createLazyTokenContract(
        TokenType.Erc721,
        {
          name: "Sweet collection",
          symbol: "CONTRACT_SYMBOL",
          description: "Sweet collection description",
          avatar: fileStream,
          contractArguments: {
            placeholderTokenURI:
              "ipfs://QmcEjuCpy2wRTYvAWuZvkGEUzku2cjyMJJo94rYveceFUK",
            tokenMintLimit: 1000,
          },
        }
      );

    expect(tx).toBeDefined();
    expect(contract).toBeDefined();
  });
});
