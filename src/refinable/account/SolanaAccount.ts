import { PublicKey } from "@solana/web3.js";
import { Account } from "../../interfaces/Account";
import { fromLamports } from "../../solana/utils";
import { RefinableSolanaClient } from "../RefinableSolanaClient";

export default class SolanaAccount implements Account {
  constructor(
    private readonly address: string,
    private readonly refinable: RefinableSolanaClient
  ) {}

  /**
   * Balance of Any Token (converted from wei).
   * @return {Promise<string>}
   */
  public async getTokenBalance(tokenAddress: string): Promise<string> {
    throw new Error("Not implemented");
  }

  public async getBalance(): Promise<string> {
    const result = await this.refinable.connection.getBalance(
      new PublicKey(this.address)
    );

    return fromLamports(result).toString();
  }
}
