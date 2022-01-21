import { Store } from "@metaplex-foundation/mpl-metaplex";
import { Wallet } from "@metaplex/js";
import { Connection } from "@solana/web3.js";
import { solanaChainIds, solanaStorePubKeys } from "../config/solana";
import { PartialNFTItem } from "../nft/AbstractNFT";
import { SPLNFT } from "../nft/SPLNFT";
import { Options, RefinableSolanaOptions } from "../types/RefinableOptions";
import { getConnectionByChainId } from "../utils/connection";
import SolanaAccount from "./account/SolanaAccount";
import { RefinableBaseClient } from "./RefinableBaseClient";

export class RefinableSolanaClient extends RefinableBaseClient<RefinableSolanaOptions> {
  public account: SolanaAccount;
  private _connection: Connection;
  public store: Store;

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

  async init() {
    this.store = await Store.load(
      this._connection,
      solanaStorePubKeys[this.options.environment]
    );
  }

  constructor(
    public readonly provider: Wallet,
    public readonly accountAddress: string,
    options: Options<RefinableSolanaOptions & { apiOrBearerToken: string }>
  ) {
    super(options.apiOrBearerToken, options, { commitment: "finalized" });

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
