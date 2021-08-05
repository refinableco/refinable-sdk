import Web3 from "web3";

import { Network } from "../type";
import { ERC1155Abi } from "./../abis";
import {
  ERC1155_ADDRESS,
  ERC1155_TESTNET_ADDRESS,
  PROXY_CONTRACT,
} from "./../constants";
import { ContractBase } from "./ContractBase";

export class ERC1155Contract extends ContractBase {
  constructor(web3: Web3, network: Network) {
    const address =
      network === Network.BCS ? ERC1155_ADDRESS : ERC1155_TESTNET_ADDRESS;
    super(web3, ERC1155Abi, address);
  }

  public async isApprovedForAll({
    accountAddress,
  }: {
    accountAddress: string;
  }): Promise<boolean | null> {
    try {
      const result = await this.methods
        .isApprovedForAll(accountAddress, PROXY_CONTRACT)
        .call({ from: accountAddress });
      return result;
    } catch (err) {
      console.error("isApprovedForAll", err);
      // if something went wrong because we don't know NFT
      // is either approved or not
      return null;
    }
  }

  public async setApprovalForAll({
    accountAddress,
  }: {
    accountAddress: string;
  }) {
    try {
      const gas = await this.methods
        .setApprovalForAll(PROXY_CONTRACT, true)
        .estimateGas({ from: accountAddress });

      await this.methods
        .setApprovalForAll(PROXY_CONTRACT, true)
        .send({ from: accountAddress, gas });
      return true;
    } catch (err) {
      console.error("setApprovalForAll", err);
      return false;
    }
  }
}
