import { Transaction } from "./Transaction";
import {
  TransactionResponse,
  TransactionReceipt,
} from "@ethersproject/abstract-provider";
import assert from "assert";

export default class EvmTransaction implements Transaction {
  public txReceipt: TransactionReceipt;
  constructor(private readonly tx: TransactionResponse) {}

  get txId() {
    return this.tx.hash;
  }

  get timestamp() {
    return this.tx.timestamp;
  }

  get successful() {
    assert(!!this.txReceipt, "Must await tx first");

    return this.txReceipt.status === 1;
  }

  async wait(confirmations?: number) {
    this.txReceipt = await this.tx.wait(confirmations);

    return this;
  }
}
