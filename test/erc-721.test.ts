import { ERC721Contract } from "../src/contracts/ERC721Contract";
import { Network } from "../src/type";
import {
  web3,
  UNKNOWN_TOKEN,
  ACCOUNT_ADDRESS,
  ANOTHER_ADDRESS,
  INVALID_TOKEN,
  SAMPLE_TOKEN_721,
  SAMPLE_TOKEN_1155,
} from "./mocks";

describe("ERC 721 Contract", () => {
  let erc721: ERC721Contract;

  beforeAll(() => {
    erc721 = new ERC721Contract(web3, Network.BSCTest);
  });

  describe("isApprovedForAll method", () => {
    test("normal case", async () => {
      const allProved = await erc721.isApprovedForAll({
        accountAddress: ACCOUNT_ADDRESS,
      });
      expect(typeof allProved).toBe("boolean");
    });

    test("from unknown account", async () => {
      const allProved = await erc721.isApprovedForAll({
        accountAddress: ANOTHER_ADDRESS,
      });

      expect(typeof allProved).toBe("boolean");
    });
    test("invalid address", async () => {
      const allProved = await erc721.isApprovedForAll({
        accountAddress: ACCOUNT_ADDRESS + "A",
      });

      expect(allProved).toBeNull();
    });
  });

  describe("approve method", () => {
    test("non-existent NFT", async () => {
      const approved = await erc721.approve({
        accountAddress: ACCOUNT_ADDRESS,
        tokenId: UNKNOWN_TOKEN,
      });

      expect(approved).toBe(false);
    });

    test("not owned NFT", async () => {
      const approved = await erc721.approve({
        accountAddress: ACCOUNT_ADDRESS,
        tokenId: UNKNOWN_TOKEN,
      });

      expect(approved).toBe(false);
    });

    test("invalid NFT", async () => {
      const approved = await erc721.approve({
        accountAddress: ACCOUNT_ADDRESS,
        tokenId: INVALID_TOKEN,
      });

      expect(approved).toBe(false);
    });

    test("1155 NFT", async () => {
      const approved = await erc721.approve({
        accountAddress: ACCOUNT_ADDRESS,
        tokenId: SAMPLE_TOKEN_1155,
      });

      expect(approved).toBe(false);
    });

    test("FROM different account", async () => {
      const approved = await erc721.approve({
        accountAddress: ANOTHER_ADDRESS,
        tokenId: SAMPLE_TOKEN_721,
      });

      expect(approved).toBe(false);
    });

    test("someone's NFT", async () => {
      const SOMEONE_NFT = 190;

      const approved = await erc721.approve({
        accountAddress: ANOTHER_ADDRESS,
        tokenId: SOMEONE_NFT,
      });

      expect(approved).toBe(false);
    });

    test("normal case", async () => {
      const approved = await erc721.approve({
        accountAddress: ACCOUNT_ADDRESS,
        tokenId: SAMPLE_TOKEN_721,
      });

      expect(approved).toBe(true);
    });
  });
});
