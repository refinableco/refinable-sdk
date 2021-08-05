import Web3 from "web3";

import { nonceERC1155Abi } from "./../abis";
import { Network } from "../type";
import {
  ERC1155_NONCE_ADDRESS,
  ERC1155_NONCE_TESTNET_ADDRESS,
} from "./../constants";
import { ContractBase } from "./ContractBase";

export class ERC1155NonceContract extends ContractBase {
  constructor(web3: Web3, network: Network) {
    const address =
      network === Network.BCS
        ? ERC1155_NONCE_ADDRESS
        : ERC1155_NONCE_TESTNET_ADDRESS;
    super(web3, nonceERC1155Abi, address);
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
      console.error("getNonce", err);
    }
  }
}
