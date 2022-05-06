import type { Wallet } from "@metaplex/js";
import type { Connection } from "@solana/web3.js";
import { solanaChainIds } from "../config/solana";
import { PartialNFTItem } from "../nft/AbstractNFT";
import { SPLNFT } from "../nft/SPLNFT";
import { Options, RefinableSolanaOptions } from "../types/RefinableOptions";
import { getConnectionByChainId } from "../utils/connection";
import SolanaAccount from "./account/SolanaAccount";
import { RefinableBaseClient } from "./RefinableBaseClient";

export class RefinableSolanaClient extends RefinableBaseClient<RefinableSolanaOptions> {
  public account: SolanaAccount;
  private _connection: Connection;

  static async getAddress(provider: any): Promise<string> {
    return provider.publicKey.toBase58();
  }

  static async create(
    provider: Wallet,
    apiOrBearerToken: string,
    options?: Options<RefinableSolanaOptions>
  ) {
    const accountAddress = provider.publicKey.toBase58();
    const refinable = new RefinableSolanaClient(provider, accountAddress, {
      ...options,
      apiOrBearerToken,
    });

    await refinable.init();

    return refinable;
  }

  async init() {}

  constructor(
    public readonly provider: Wallet,
    accountAddress: string,
    options: Options<RefinableSolanaOptions & { apiOrBearerToken: string }>
  ) {
    super(options.apiOrBearerToken, options, { commitment: "finalized" });
    this._accountAddress = accountAddress;
    this.account = new SolanaAccount(accountAddress, this);
    this._connection = getConnectionByChainId(
      solanaChainIds[this.options.environment]
    );
  }

  get connection() {
    return this._connection;
  }

  createNft(item: PartialNFTItem): SPLNFT {
    if (!item) return null;
    return new SPLNFT(this, item);
  }
}
