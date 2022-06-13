import { PublicKey } from "@solana/web3.js";
import { Account } from "../../interfaces/Account";
import { fromLamports } from "../../solana/utils";
import { getConnectionByChainId } from "../../utils/connection";
import { Refinable } from "../Refinable";

export default class SolanaAccount implements Account {
  constructor(protected readonly refinable: Refinable) {}

  async getAddress(): Promise<string> {
    return this.refinable.provider.publicKey.toBase58();
  }

  /**
   * Balance of Any Token (converted from wei).
   * @return {Promise<string>}
   */
  public async getTokenBalance(tokenAddress: string): Promise<string> {
    throw new Error("Not implemented");
  }

  public async getBalance(chainId?: number): Promise<string> {
    const connection = chainId
      ? getConnectionByChainId(chainId)
      : this.refinable.solana.connection;

    const result = await connection.getBalance(
      new PublicKey(this.refinable.accountAddress)
    );

    return fromLamports(result).toString();
  }
}
