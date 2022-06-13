import type { Connection } from "@solana/web3.js";
import _ from "lodash";
import { solanaChainIds } from "../../config/solana";
import {
  RefinableOptions,
  RefinableSolanaOptions,
} from "../../types/RefinableOptions";
import { getConnectionByChainId } from "../../utils/connection";
import SolanaAccount from "./../account/SolanaAccount";
import { Refinable } from "./../Refinable";

export class RefinableSolanaClient {
  public account: SolanaAccount;
  private _connection: Connection;
  private _options: RefinableSolanaOptions = { commitment: "finalized" };

  async init() {}

  constructor(
    options: RefinableOptions,
    private readonly refinableClient: Refinable
  ) {
    this._options = _.merge(this._options, options.solana);

    this.account = new SolanaAccount(refinableClient);
    this._connection = getConnectionByChainId(
      solanaChainIds[options.environment]
    );
  }

  get connection() {
    return this._connection;
  }
}
