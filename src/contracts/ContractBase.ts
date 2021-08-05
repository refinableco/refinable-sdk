import Web3 from "web3";
import { AbiItem } from "web3-utils";

export class ContractBase {
  public methods: any;

  constructor(web3: Web3, abi: AbiItem[], contractAddress: string) {
    const contracts = new web3.eth.Contract(abi, contractAddress);
    this.methods = contracts.methods;
  }
}
