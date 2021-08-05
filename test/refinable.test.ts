import {
  ERC721_TESTNET_ADDRESS,
  ERC1155_TESTNET_ADDRESS,
} from "../src/constants";
import { Refinable } from "../src/refinable";
import { Network } from "../src/type";

import {
  provider,
  SAMPLE_TOKEN_721,
  SAMPLE_TOKEN_1155,
  UNKNOWN_TOKEN,
  ACCOUNT_ADDRESS,
  AVAILABLE_TOKEN_1155,
} from "./mocks";

describe("Refinable", () => {
  let refinable: Refinable;

  beforeAll(async () => {
    refinable = new Refinable(provider, Network.BSCTest, {
      address: ACCOUNT_ADDRESS,
      privateKey: process.env.PRIVATE_KEY!,
    });
  });

  describe("Approve 721", () => {
    test("normal case", async () => {
      const res = await refinable.approveNFT({
        tokenId: SAMPLE_TOKEN_721,
        contractAddress: ERC721_TESTNET_ADDRESS,
        nftBillInfo: {
          amount: 0.01,
          currency: "BNB",
          supply: 1,
        },
      });
      expect(res).not.toBeFalsy();
    });

    test("unknown tokenId", async () => {
      const res1 = await refinable.approveNFT({
        tokenId: UNKNOWN_TOKEN,
        contractAddress: ERC721_TESTNET_ADDRESS,
        nftBillInfo: {
          amount: 0.01,
          currency: "BNB",
          supply: 1,
        },
      });
      const res2 = await refinable.approveNFT({
        tokenId: UNKNOWN_TOKEN,
        contractAddress: ERC721_TESTNET_ADDRESS,
        nftBillInfo: {
          amount: 0.01,
          currency: "BNB",
          supply: 1,
        },
      });
      expect(res1.data).toBeFalsy();
      expect(res2.data).toBeFalsy();
    });

    test("with contract 1155 address", async () => {
      const res = await refinable.approveNFT({
        tokenId: SAMPLE_TOKEN_721,
        contractAddress: ERC1155_TESTNET_ADDRESS,
        nftBillInfo: {
          amount: 0.01,
          currency: "BNB",
          supply: 1,
        },
      });
      expect(res.data).toBeFalsy();
    });

    test("with invalid amount", async () => {
      const res1 = await refinable.approveNFT({
        tokenId: SAMPLE_TOKEN_721,
        contractAddress: ERC721_TESTNET_ADDRESS,
        nftBillInfo: {
          amount: -1,
          currency: "BNB",
          supply: 1,
        },
      });
      const res2 = await refinable.approveNFT({
        tokenId: SAMPLE_TOKEN_721,
        contractAddress: ERC721_TESTNET_ADDRESS,
        nftBillInfo: {
          amount: 999999999999,
          currency: "BNB",
          supply: 1,
        },
      });
      expect(res1.data).toBeFalsy();
      expect(res2.data).toBeFalsy();
    });

    test("with unknown currency", async () => {
      const res = await refinable.approveNFT({
        tokenId: SAMPLE_TOKEN_721,
        contractAddress: ERC721_TESTNET_ADDRESS,
        nftBillInfo: {
          amount: 0.01,
          currency: "ASD",
          supply: 1,
        },
      });
      expect(res.data).toBeFalsy();
    });

    test("with supply large than 1", async () => {
      const res = await refinable.approveNFT({
        tokenId: SAMPLE_TOKEN_721,
        contractAddress: ERC1155_TESTNET_ADDRESS,
        nftBillInfo: {
          amount: 0.01,
          currency: "BNB",
          supply: 2,
        },
      });
      expect(res.data).toBeFalsy();
    });
  });

  describe("Approve 1155", () => {
    test("supply than available", async () => {
      const res = await refinable.approveNFT({
        tokenId: SAMPLE_TOKEN_1155,
        contractAddress: ERC1155_TESTNET_ADDRESS,
        nftBillInfo: {
          amount: 0.01,
          currency: "BNB",
          supply: AVAILABLE_TOKEN_1155 + 1,
        },
      });
      expect(res.data).toBeFalsy();
    });

    test("invalid currency", async () => {
      const res = await refinable.approveNFT({
        tokenId: SAMPLE_TOKEN_1155,
        contractAddress: ERC1155_TESTNET_ADDRESS,
        nftBillInfo: {
          amount: 0.01,
          currency: "ASD",
          supply: AVAILABLE_TOKEN_1155,
        },
      });
      expect(res.data).toBeFalsy();
    });

    test("normal case", async () => {
      const res = await refinable.approveNFT({
        tokenId: SAMPLE_TOKEN_1155,
        contractAddress: ERC1155_TESTNET_ADDRESS,
        nftBillInfo: {
          amount: 0.01,
          currency: "BNB",
          supply: AVAILABLE_TOKEN_1155,
        },
      });

      expect(res).not.toBeFalsy();
    });
  });
});
