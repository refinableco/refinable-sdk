import { ERC1155NonceContract } from "../src/contracts/ERC1155NonceContract";
import { Network } from "../src/type";
import {
  ERC721_TESTNET_ADDRESS,
  ERC1155_TESTNET_ADDRESS,
} from "../src/constants";
import {
  web3,
  ACCOUNT_ADDRESS,
  SAMPLE_TOKEN_1155,
  SAMPLE_TOKEN_721,
  UNKNOWN_TOKEN,
  ANOTHER_ADDRESS,
} from "./mocks";

describe("getNonce 1155", () => {
  let erc1155Nonce: ERC1155NonceContract;

  beforeAll(() => {
    erc1155Nonce = new ERC1155NonceContract(web3, Network.BSCTest);
  });

  test("normal case", async () => {
    const _nonce = await erc1155Nonce.getNonce({
      contractAddress: ERC1155_TESTNET_ADDRESS,
      tokenId: SAMPLE_TOKEN_1155,
      accountAddress: ACCOUNT_ADDRESS,
    });

    expect(Number(_nonce)).toBeGreaterThanOrEqual(0);
  });

  test("non-exist tokenId", async () => {
    const _nonce = await erc1155Nonce.getNonce({
      contractAddress: ERC1155_TESTNET_ADDRESS,
      tokenId: UNKNOWN_TOKEN,
      accountAddress: ACCOUNT_ADDRESS,
    });

    expect(_nonce).toBe("0");
  });

  test("wrong owner address", async () => {
    const _nonce = await erc1155Nonce.getNonce({
      contractAddress: ERC1155_TESTNET_ADDRESS,
      tokenId: SAMPLE_TOKEN_1155,
      accountAddress: ANOTHER_ADDRESS,
    });

    expect(_nonce).toBe("0");
  });

  test("with 721 contract address", async () => {
    const _nonce = await erc1155Nonce.getNonce({
      contractAddress: ERC721_TESTNET_ADDRESS,
      tokenId: SAMPLE_TOKEN_1155,
      accountAddress: ACCOUNT_ADDRESS,
    });

    expect(_nonce).toBe("0");
  });

  test("with 721 tokenId", async () => {
    const _nonce = await erc1155Nonce.getNonce({
      contractAddress: ERC1155_TESTNET_ADDRESS,
      tokenId: SAMPLE_TOKEN_721,
      accountAddress: ACCOUNT_ADDRESS,
    });

    expect(_nonce).toBe("0");
  });

  test("with tokenId 721 and contract address 721", async () => {
    const _nonce = await erc1155Nonce.getNonce({
      contractAddress: ERC721_TESTNET_ADDRESS,
      tokenId: SAMPLE_TOKEN_721,
      accountAddress: ACCOUNT_ADDRESS,
    });

    expect(_nonce).toBe("0");
  });
});
