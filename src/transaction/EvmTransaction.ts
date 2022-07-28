import { ethers } from "ethers";
import { Transaction } from "./Transaction";

export default class EvmTransaction implements Transaction {
  constructor(
    public txReceipt: ethers.ContractReceipt,
    private readonly provider?: ethers.providers.Provider
  ) {}

  get txId() {
    return this.txReceipt.transactionHash;
  }

  get success() {
    return this.txReceipt.status === 1;
  }

  async wait(confirmations?: number) {
    if (this.provider) {
      this.txReceipt = await this.provider.waitForTransaction(
        this.txReceipt.transactionHash,
        confirmations
      );
    }

    return this;
  }
}
