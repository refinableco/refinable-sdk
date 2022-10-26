import {
  Chain,
  ERC721NFT,
  NFTBuilder,
  Refinable,
  StandardRoyaltyStrategy,
  TokenType,
} from "../../src";
import {
  ContractTag,
  ContractTypes,
  CreateItemMutation,
} from "../../src/@types/graphql";
import { Contract, IContract } from "../../src/refinable/contract/Contract";
import EvmTransaction from "../../src/transaction/EvmTransaction";
import { getMockRefinableClient } from "../helpers/client";
import { getEvmTxReceipt } from "./Transactions.spec";

const getContract = (refinable: Refinable, override: Partial<IContract> = {}) =>
  new Contract(
    refinable,
    {
      tags: [ContractTag.TokenV1_0_0],
      chainId: 1,
      contractABI: "[]",
      contractAddress: "0x898de23b24C7C2189488079a6871C711Dd125504",
      type: ContractTypes.Erc721Token,
      default: true,
      ...override,
    },
    {}
  );

const contractMock = {
  contractWrapper: {
    sendTransaction: jest
      .fn()
      .mockResolvedValue(new EvmTransaction(getEvmTxReceipt())),
  },
} as any;

const ITEM: CreateItemMutation["createItem"]["item"] = {
  chainId: Chain.Local,
  contractAddress: "0x898de23b24C7C2189488079a6871C711Dd125504",
  type: TokenType.Erc721,
  supply: 1,
  totalSupply: 1,
  tokenId: "999",
  id: "KHDJKWJHFGWEHGFJWJHF",
  properties: {
    ipfsDocument: "ipfs://ipfsdocumentUrl",
  } as any,
};

const ITEM_CREATE_RESPONSE: CreateItemMutation["createItem"] = {
  signature: "==TEST==",
  item: ITEM,
};

describe("NFTBuilder", () => {
  let refinable: Refinable;
  const ETH_ADDRESS = "0x898de23b24C7C2189488079a6871C711Dd125504";

  beforeAll(async () => {
    refinable = getMockRefinableClient(ETH_ADDRESS);
  });

  let erc721Builder: NFTBuilder;
  const BUILD_DATA = {
    contractAddress: ETH_ADDRESS,
    chainId: Chain.Local,
    supply: 1,
    type: TokenType.Erc721,
    royalty: new StandardRoyaltyStrategy([
      { recipient: ETH_ADDRESS, value: 10 },
    ]),
  };

  beforeEach(() => {
    erc721Builder = new NFTBuilder(refinable, BUILD_DATA);
  });

  it("Should be able serialize royaltySettings", async () => {
    expect(erc721Builder.royaltySettings).toEqual({
      royaltyBps: 0,
      royaltyStrategy: 0,
      shares: [["0x898de23b24C7C2189488079a6871C711Dd125504", 10]],
    });
  });

  describe("create", () => {
    it("Should throw error in create when buildData not set", async () => {
      const builder = new NFTBuilder(refinable);

      expect(builder.create()).rejects.toThrowError(
        "NFT token data not initalized"
      );
    });

    it("Should throw error when contractAddress not set", async () => {
      const builder = new NFTBuilder(refinable, {
        ...BUILD_DATA,
        contractAddress: undefined,
      });

      expect(builder.create()).rejects.toThrowError(
        'Parameter "contractAddress" is required. None passed or no default contract found'
      );
    });

    it("Should throw error when create api request fails", async () => {
      jest
        .spyOn(refinable.graphqlClient, "request")
        .mockRejectedValueOnce(new Error("API Error"));

      expect(() => erc721Builder.tokenId).toThrow(
        "Item not created, please create first"
      );

      expect(erc721Builder.create()).rejects.toThrow("API Error");
      expect(refinable.graphqlClient.request).toBeCalled();
    });

    it("Should be able to create NFT", async () => {
      jest
        .spyOn(refinable.graphqlClient, "request")
        .mockResolvedValueOnce({ createItem: ITEM_CREATE_RESPONSE });

      expect(() => erc721Builder.tokenId).toThrow(
        "Item not created, please create first"
      );

      await erc721Builder.create();

      expect(refinable.graphqlClient.request).toBeCalled();
      expect(erc721Builder.tokenId).toBe(ITEM_CREATE_RESPONSE.item.tokenId);
    });
  });

  describe("mint", () => {
    it("Should not be able to mint when not created", async () => {
      expect(erc721Builder.mint()).rejects.toThrow(
        "Item not created, please create first"
      );
    });

    it("Should be able to mint V1 ERC721 TOKEN", async () => {
      const tokenContract = getContract(refinable);

      jest
        .spyOn(refinable.graphqlClient, "request")
        .mockResolvedValueOnce({ createItem: ITEM_CREATE_RESPONSE });

      jest
        .spyOn(refinable.evm.contracts, "getMintableTokenContract")
        .mockResolvedValueOnce(tokenContract);

      jest.spyOn(tokenContract, "connect").mockReturnValue(contractMock);

      expect(() => erc721Builder.tokenId).toThrow(
        "Item not created, please create first"
      );

      await erc721Builder.create();
      await erc721Builder.mint();

      expect(erc721Builder.mintTransaction).toBeDefined();
      expect(erc721Builder.mintTransaction.txId).toEqual(
        getEvmTxReceipt().transactionHash
      );

      expect(contractMock.contractWrapper.sendTransaction).toHaveBeenCalledWith(
        "mint",
        [
          ITEM.tokenId,
          ITEM_CREATE_RESPONSE.signature,
          [[ETH_ADDRESS, 10]],
          ITEM.properties.ipfsDocument,
        ]
      );
    });
    it("Should be able to mint V1 ERC1155 TOKEN", async () => {
      const erc1155Builder = new NFTBuilder(refinable, {
        ...BUILD_DATA,
        type: TokenType.Erc1155,
        supply: 9,
      });

      const tokenContract = getContract(refinable, {
        type: ContractTypes.Erc1155Token,
      });

      jest.spyOn(refinable.graphqlClient, "request").mockResolvedValueOnce({
        createItem: {
          ...ITEM_CREATE_RESPONSE,
          item: {
            ...ITEM_CREATE_RESPONSE["item"],
            type: TokenType.Erc1155,
            supply: 9,
          },
        },
      });

      jest
        .spyOn(refinable.evm.contracts, "getMintableTokenContract")
        .mockResolvedValueOnce(tokenContract);

      jest.spyOn(tokenContract, "connect").mockReturnValue(contractMock);

      expect(() => erc1155Builder.tokenId).toThrow(
        "Item not created, please create first"
      );

      await erc1155Builder.create();
      await erc1155Builder.mint();

      expect(erc1155Builder.mintTransaction).toBeDefined();
      expect(erc1155Builder.mintTransaction.txId).toEqual(
        getEvmTxReceipt().transactionHash
      );

      expect(contractMock.contractWrapper.sendTransaction).toHaveBeenCalledWith(
        "mint",
        [
          ITEM.tokenId,
          ITEM_CREATE_RESPONSE.signature,
          [[ETH_ADDRESS, 10]],
          "9",
          ITEM.properties.ipfsDocument,
        ]
      );
    });

    it("Should be able to mint V2 ERC721 TOKEN", async () => {
      const tokenContract = getContract(refinable, {
        tags: [ContractTag.TokenV2_0_0],
      });

      jest
        .spyOn(refinable.graphqlClient, "request")
        .mockResolvedValueOnce({ createItem: ITEM_CREATE_RESPONSE });

      jest
        .spyOn(refinable.evm.contracts, "getMintableTokenContract")
        .mockResolvedValueOnce(tokenContract);

      jest.spyOn(tokenContract, "connect").mockReturnValue(contractMock);

      expect(() => erc721Builder.tokenId).toThrow(
        "Item not created, please create first"
      );

      await erc721Builder.create();
      await erc721Builder.mint();

      expect(erc721Builder.mintTransaction).toBeDefined();
      expect(erc721Builder.mintTransaction.txId).toEqual(
        getEvmTxReceipt().transactionHash
      );

      expect(contractMock.contractWrapper.sendTransaction).toHaveBeenCalledWith(
        "mint",
        [
          ITEM.tokenId,
          ITEM_CREATE_RESPONSE.signature,
          [[ETH_ADDRESS, 10]],
          ITEM.properties.ipfsDocument,
          0,
          0,
        ]
      );
    });

    it("Should be able to mint V3 ERC721 TOKEN", async () => {
      const tokenContract = getContract(refinable, {
        tags: [ContractTag.TokenV3_0_0],
      });

      jest
        .spyOn(refinable.graphqlClient, "request")
        .mockResolvedValueOnce({ createItem: ITEM_CREATE_RESPONSE });

      jest
        .spyOn(refinable.evm.contracts, "getMintableTokenContract")
        .mockResolvedValueOnce(tokenContract);

      jest.spyOn(tokenContract, "connect").mockReturnValue(contractMock);

      expect(() => erc721Builder.tokenId).toThrow(
        "Item not created, please create first"
      );

      await erc721Builder.create();
      await erc721Builder.mint();

      expect(erc721Builder.mintTransaction).toBeDefined();
      expect(erc721Builder.mintTransaction.txId).toEqual(
        getEvmTxReceipt().transactionHash
      );

      expect(contractMock.contractWrapper.sendTransaction).toHaveBeenCalledWith(
        "mint",
        [
          ITEM.tokenId,
          ITEM_CREATE_RESPONSE.signature,
          [[ETH_ADDRESS, 10]],
          ITEM.properties.ipfsDocument,
          0,
          0,
          [],
        ]
      );
    });
  });

  describe("finishMint", () => {
    it("Should throw error when item is not minted", async () => {
      const builder = new NFTBuilder(refinable);

      expect(builder.finishMint()).rejects.toThrowError(
        "Item not minted, please mint first"
      );
    });

    it("Should be able to finish minting an NFT", async () => {
      const tokenContract = getContract(refinable);

      jest
        .spyOn(refinable.graphqlClient, "request")
        .mockResolvedValueOnce({ createItem: ITEM_CREATE_RESPONSE })
        .mockResolvedValueOnce({
          finishMint: { item: ITEM_CREATE_RESPONSE["item"] },
        });

      jest
        .spyOn(refinable.evm.contracts, "getMintableTokenContract")
        .mockResolvedValueOnce(tokenContract);

      jest.spyOn(tokenContract, "connect").mockReturnValue(contractMock);

      expect(() => erc721Builder.tokenId).toThrow(
        "Item not created, please create first"
      );

      await erc721Builder.create();
      await erc721Builder.mint();

      const nft = await erc721Builder.finishMint();

      expect(nft).toBeInstanceOf(ERC721NFT);
      expect(nft.getItem().tokenId).toBe(ITEM.tokenId);
      expect(nft.getItem().contractAddress).toBe(ITEM.contractAddress);
      expect(nft.getItem().chainId).toBe(ITEM.chainId);
    });
  });

  describe("createAndMint", () => {
    beforeEach(() => {
      jest.spyOn(refinable, "uploadFile").mockResolvedValue("fileKey");
    });

    it("Should be able to create and mint without passing contractsAddress", async () => {
      const builder = new NFTBuilder(refinable, {
        ...BUILD_DATA,
        contractAddress: undefined,
      });
      const tokenContract = getContract(refinable);

      jest
        .spyOn(refinable.graphqlClient, "request")
        .mockResolvedValueOnce({ createItem: ITEM_CREATE_RESPONSE })
        .mockResolvedValueOnce({
          finishMint: { item: ITEM_CREATE_RESPONSE["item"] },
        });

      jest
        .spyOn(refinable.evm.contracts, "getDefaultTokenContract")
        .mockResolvedValueOnce(tokenContract);

      jest
        .spyOn(refinable.evm.contracts, "getMintableTokenContract")
        .mockResolvedValueOnce(tokenContract);

      jest.spyOn(tokenContract, "connect").mockReturnValue(contractMock);

      const nft = await builder.createAndMint();

      expect(nft).toBeInstanceOf(ERC721NFT);
      expect(nft.getItem().tokenId).toBe(ITEM.tokenId);
      expect(nft.getItem().contractAddress).toBe(tokenContract.contractAddress);
      expect(nft.getItem().chainId).toBe(ITEM.chainId);
    });

    it("Should be able to create and mint using custom contractsAddress", async () => {
      const builder = new NFTBuilder(refinable, {
        ...BUILD_DATA,
        contractAddress: "0x4fabb145d64652a948d72533023f6e7a623c7c53",
      });
      const tokenContract = getContract(refinable);

      jest
        .spyOn(refinable.graphqlClient, "request")
        .mockResolvedValueOnce({ createItem: ITEM_CREATE_RESPONSE })
        .mockResolvedValueOnce({
          finishMint: {
            item: {
              ...ITEM_CREATE_RESPONSE["item"],
              contractAddress: "0x4fabb145d64652a948d72533023f6e7a623c7c53",
            },
          },
        });

      jest
        .spyOn(refinable.evm.contracts, "getMintableTokenContract")
        .mockResolvedValueOnce(tokenContract);

      jest.spyOn(tokenContract, "connect").mockReturnValue(contractMock);

      const nft = await builder.createAndMint();

      expect(
        refinable.evm.contracts.getDefaultTokenContract
      ).not.toHaveBeenCalled();
      expect(nft).toBeInstanceOf(ERC721NFT);
      expect(nft.getItem().tokenId).toBe(ITEM.tokenId);
      expect(nft.getItem().contractAddress).toBe(
        "0x4fabb145d64652a948d72533023f6e7a623c7c53"
      );
      expect(nft.getItem().chainId).toBe(ITEM.chainId);
    });
  });
});
