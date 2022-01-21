import {
  Commitment,
  Connection,
  RpcResponseAndContext,
  SignatureResult,
} from "@solana/web3.js";
import assert from "assert";
import { Transaction } from "./Transaction";

export default class SolanaTransaction implements Transaction {
  public txResult: RpcResponseAndContext<SignatureResult>;

  timestamp: number;

  constructor(
    public readonly txId: string,
    private readonly connection: Connection
  ) {}

  get successful() {
    assert(!!this.txResult, "Must await tx first");

    console.log(this.txResult);
    

    return !this.txResult.value?.err;
  }

  async wait(commitment: Commitment = "finalized") {
    this.txResult = await this.connection.confirmTransaction(
      this.txId,
      commitment
    );

    return this;
  }
}
