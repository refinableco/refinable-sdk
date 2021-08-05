import { ERC721NonceContract } from "../src/contracts/ERC721NonceContract";
import { Network } from "../src/type";
import {
  ERC721_TESTNET_ADDRESS,
  ERC1155_TESTNET_ADDRESS,
} from "../src/constants";
import {
  web3,
  ACCOUNT_ADDRESS,
  UNKNOWN_TOKEN,
  SAMPLE_TOKEN_1155,
  SAMPLE_TOKEN_721,
  ANOTHER_ADDRESS,
} from "./mocks";

describe("getNonce 721", () => {
  let erc721Nonce: ERC721NonceContract;

  beforeAll(() => {
    erc721Nonce = new ERC721NonceContract(web3, Network.BSCTest);
  });

  test("normal case", async () => {
    const _nonce = await erc721Nonce.getNonce({
      contractAddress: ERC721_TESTNET_ADDRESS,
      tokenId: SAMPLE_TOKEN_721,
      accountAddress: ACCOUNT_ADDRESS,
    });

    expect(Number(_nonce)).toBeGreaterThanOrEqual(0);
  });

  test("non-exist tokenId", async () => {
    const _nonce = await erc721Nonce.getNonce({
      contractAddress: ERC721_TESTNET_ADDRESS,
      tokenId: UNKNOWN_TOKEN,
      accountAddress: ACCOUNT_ADDRESS,
    });

    expect(_nonce).toBe("0");
  });

  test("wrong owner address", async () => {
    const _nonce = await erc721Nonce.getNonce({
      contractAddress: ERC721_TESTNET_ADDRESS,
      tokenId: SAMPLE_TOKEN_721,
      accountAddress: ANOTHER_ADDRESS,
    });

    expect(_nonce).toBe("0");
  });

  test("with 1155 contract address", async () => {
    const _nonce = await erc721Nonce.getNonce({
      contractAddress: ERC1155_TESTNET_ADDRESS,
      tokenId: SAMPLE_TOKEN_721,
      accountAddress: ACCOUNT_ADDRESS,
    });

    expect(_nonce).toBe("0");
  });

  test("with 1155 tokenId", async () => {
    const _nonce = await erc721Nonce.getNonce({
      contractAddress: ERC721_TESTNET_ADDRESS,
      tokenId: SAMPLE_TOKEN_1155,
      accountAddress: ACCOUNT_ADDRESS,
    });

    expect(_nonce).toBe("0");
  });

  test("with tokenId 1155 and contract address 1155", async () => {
    const _nonce = await erc721Nonce.getNonce({
      contractAddress: ERC1155_TESTNET_ADDRESS,
      tokenId: SAMPLE_TOKEN_1155,
      accountAddress: ACCOUNT_ADDRESS,
    });

    expect(_nonce).toBe("0");
  });
});
