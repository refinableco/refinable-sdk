import { ERC1155Contract } from "../src/contracts/ERC1155Contract";
import { Network } from "../src/type";
import { web3, ACCOUNT_ADDRESS, ANOTHER_ADDRESS } from "./mocks";

describe("ERC 1155 Contract", () => {
  let erc1155: ERC1155Contract;

  beforeAll(() => {
    erc1155 = new ERC1155Contract(web3, Network.BSCTest);
  });

  describe("isApprovedForAll method", () => {
    test("normal case", async () => {
      const allProved = await erc1155.isApprovedForAll({
        accountAddress: ACCOUNT_ADDRESS,
      });

      expect(typeof allProved).toBe("boolean");
    });

    test("unknown account", async () => {
      const allProved = await erc1155.isApprovedForAll({
        accountAddress: ANOTHER_ADDRESS,
      });

      expect(typeof allProved).toBe("boolean");
    });

    test("invalid address", async () => {
      const allProved = await erc1155.isApprovedForAll({
        accountAddress: ACCOUNT_ADDRESS + "A",
      });

      expect(allProved).toBeNull();
    });
  });

  describe("setApprovalForAll method", () => {
    test("on address having no 1155 NFT", async () => {
      const approved = await erc1155.setApprovalForAll({
        accountAddress: ANOTHER_ADDRESS,
      });

      expect(approved).toBe(false);
    });

    test("on invalid address", async () => {
      const approved = await erc1155.setApprovalForAll({
        accountAddress: ANOTHER_ADDRESS + "A",
      });

      expect(approved).toBe(false);
    });

    test("normal case", async () => {
      const approved = await erc1155.setApprovalForAll({
        accountAddress: ACCOUNT_ADDRESS,
      });

      expect(approved).toBe(true);
    });
  });
});
