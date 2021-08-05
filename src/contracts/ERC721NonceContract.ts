import Web3 from "web3";

import { Network } from "../type";
import { nonceERC721Abi } from "./../abis";
import {
  ERC721_NONCE_ADDRESS,
  ERC721_NONCE_TESTNET_ADDRESS,
} from "./../constants";
import { ContractBase } from "./ContractBase";

export class ERC721NonceContract extends ContractBase {
  constructor(web3: Web3, network: Network) {
    const address =
      network === Network.BCS
        ? ERC721_NONCE_ADDRESS
        : ERC721_NONCE_TESTNET_ADDRESS;
    super(web3, nonceERC721Abi, address);
  }

  public async getNonce({
    contractAddress,
    accountAddress,
    tokenId,
  }: {
    contractAddress: string;
    accountAddress: string;
    tokenId: number;
  }) {
    try {
      const nonce = await this.methods
        .getNonce(contractAddress, tokenId, accountAddress)
        .call({ from: accountAddress });
      return nonce;
    } catch (err) {
      console.error(err);
    }
  }
}
