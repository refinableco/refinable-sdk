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
  protected _provider: Wallet;

  static async getAddress(provider: any): Promise<string> {
    return provider.publicKey.toBase58();
  }

  static async create(
    apiToken: string,
    options?: Options<RefinableSolanaOptions>
  ) {
    const refinable = new RefinableSolanaClient({
      ...options,
      apiToken: apiToken,
    });

    await refinable.init();

    return refinable;
  }

  async init() {}

  constructor(options: Options<RefinableSolanaOptions & { apiToken: string }>) {
    super(options.apiToken, options, { commitment: "finalized" });
    this.account = new SolanaAccount(this);
    this._connection = getConnectionByChainId(
      solanaChainIds[this.options.environment]
    );
  }

  get connection() {
    return this._connection;
  }

  async connect(provider: Wallet) {
    return super.connect(provider);
  }

  createNft(item: PartialNFTItem): SPLNFT {
    if (!item) return null;
    return new SPLNFT(this, item);
  }
}
