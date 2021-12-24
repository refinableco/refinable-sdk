import { Store } from "@metaplex-foundation/mpl-metaplex";
import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { GraphQLClient } from "graphql-request";
import { apiUrl } from "./config/sdk";
import { ENDPOINTS_SOL } from "./interfaces/Network";
import { PartialNFTItem } from "./nft/AbstractNFT";
import { SOLNFT } from "./nft/SOLNFT";
import { RefinableBase } from "./RefinableBase";
import { Environment, RefinableOptions } from "./types/RefinableOptions";


export class RefinableSolana extends RefinableBase {
  private _connection: Connection;
  public store: Store;

  static async create(
    provider: SignerWalletAdapter,
    apiOrBearerToken: string,
    options?: Partial<RefinableOptions>
  ) {
    const accountAddress = provider.publicKey.toBase58();
    const refinable = new RefinableSolana(provider, accountAddress, options);

    const graphqlUrl = apiUrl[refinable._options.environment];

    if (!apiOrBearerToken) throw new Error("No authentication key present");

    // TODO: dynamic
    refinable._connection = new Connection(clusterApiUrl('devnet'));
    // refinable._connection = new Connection("http://localhost:8899");
    refinable._apiKey = apiOrBearerToken;
    refinable.apiClient = new GraphQLClient(graphqlUrl, {
      headers:
        apiOrBearerToken.length === 32
          ? { "X-API-KEY": apiOrBearerToken }
          : { authorization: `Bearer ${apiOrBearerToken}` },
    });

    refinable.store = await Store.load(
      refinable._connection,
      // TODO: Dynamic per env
      "2BTjec5VKyyk2b6Y9SLedNbozrxiDrK2uubCLAXyUBiv"
    );

    return refinable;
  }

  constructor(
    public readonly provider: SignerWalletAdapter,
    public readonly accountAddress: string,
    options: Partial<RefinableOptions> = {}
  ) {
    super();


    const { waitConfirmations = 3, environment = Environment.Mainnet } =
      options;

    this._options = {
      waitConfirmations,
      environment,
    };
  }

  get connection() {
    return this._connection;
  }

  createNft(item: PartialNFTItem): SOLNFT {
    if (!item) return null;
    return new SOLNFT(this, item);
  }
}
