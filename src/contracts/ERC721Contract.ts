import Web3 from "web3";

import { Network } from "../type";
import { ERC721Abi } from "./../abis";
import {
  ERC721_ADDRESS,
  ERC721_TESTNET_ADDRESS,
  PROXY_CONTRACT,
} from "./../constants";
import { ContractBase } from "./ContractBase";

export class ERC721Contract extends ContractBase {
  constructor(web3: Web3, network: Network) {
    const address =
      network === Network.BCS ? ERC721_ADDRESS : ERC721_TESTNET_ADDRESS;
    super(web3, ERC721Abi, address);
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
      console.error(err);
      // if something went wrong because we don't know NFT
      // is either approved or not
      return null;
    }
  }

  public async approve({
    accountAddress,
    tokenId,
  }: {
    tokenId: number;
    accountAddress: string;
  }): Promise<boolean> {
    try {
      const gas = await this.methods
        .approve(PROXY_CONTRACT, tokenId)
        .estimateGas({
          from: accountAddress,
        });

      await this.methods
        .approve(PROXY_CONTRACT, tokenId)
        .send({ from: accountAddress, gas });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}
