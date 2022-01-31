import type {
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/abstract-provider";
import { Transaction } from "./Transaction";

export default class EvmTransaction implements Transaction {
  public txReceipt: TransactionReceipt;
  constructor(private readonly tx: TransactionResponse) {}

  get txId() {
    return this.tx.hash;
  }

  get timestamp() {
    return this.tx.timestamp;
  }

  get success() {
    if (!this.txReceipt) throw new Error("Must await tx first");

    return this.txReceipt.status === 1;
  }

  async wait(confirmations?: number) {
    this.txReceipt = await this.tx.wait(confirmations);

    return this;
  }
}
