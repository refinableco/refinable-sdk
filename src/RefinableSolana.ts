import { Connection } from "@solana/web3.js";
import { GraphQLClient } from "graphql-request";
import { RefinableBase, RefinableOptions } from "./interfaces";
import { NodeWallet } from "./solana/wallet";
import { PublicKey } from '@solana/web3.js';
import { uniqWith } from 'lodash';
import { precacheUserTokenAccounts } from './solana/oyster/contexts/accounts'
import { createPipelineExecutor } from './solana/utils/createPipelineExecutor';
import {
  getEdition,
  Metadata,
  MAX_CREATOR_LEN,
  MAX_CREATOR_LIMIT,
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_URI_LENGTH,
  METADATA_PREFIX,
  UpdateStateValueFunc,
  ProcessAccountsFunc,
  AccountAndPubkey,
  MetaState,
  processMetaData,
  UnPromise,
  processMetaplexAccounts,
  processVaultData,
  processAuctions,
  isMetadataPartOfStore,
  WhitelistedCreator,
  MAX_WHITELISTED_CREATOR_SIZE,
  TokenAccount,
  MetadataKey,
  WinningConfigType,
  MasterEditionV1,
  MasterEditionV2,
} from './solana/oyster';
import { TokenAccountParser } from './solana/oyster/contexts/accounts/parsesrs'
import { getMultipleAccounts } from './solana/oyster/contexts/accounts/getMultipleAccounts'
import { ParsedAccount } from './solana/oyster/contexts/accounts/types';
import {
  AUCTION_ID,
  METADATA_PROGRAM_ID,
  METAPLEX_ID,
  StringPublicKey,
  toPublicKey,
  VAULT_ID,
} from './solana/utils/ids';
import { getProgramAccounts } from './solana/oyster/contexts/meta/web3';
import { getEmptyMetaState } from './solana/oyster/contexts/meta/getEmptyMetaState';
import { cache } from './solana/contexts/accounts';
import { SOLNFT } from "./nft/SOLNFT";

export interface NFTItem {
  holding: string,
  masterEdition: ParsedAccount<MasterEditionV1|MasterEditionV2>,
  winningConfigType: WinningConfigType,
  metadata: ParsedAccount<Metadata>,
  amountRanges: [],
}

export class RefinableSolana extends RefinableBase {
  private _apiClient?: GraphQLClient;
  private _options: RefinableOptions;
  private _apiKey: string;
  private _connection: Connection;

  static async create(
    provider: NodeWallet,
    connection: Connection,
    apiOrBearerToken: string,
    options?: Partial<RefinableOptions>
  ) {
    const accountAddress = await provider.publicKey.toBase58();
    const refinable = new RefinableSolana(provider, accountAddress, options);

    const graphqlUrl = options.apiUrl ?? "https://api.refinable.com/graphql";

    if (!apiOrBearerToken) throw new Error("No authentication key present");

    refinable._connection = connection;
    refinable._apiKey = apiOrBearerToken;
    refinable.apiClient = new GraphQLClient(graphqlUrl, {
      headers:
        apiOrBearerToken.length === 32
          ? { "X-API-KEY": apiOrBearerToken }
          : { authorization: `Bearer ${apiOrBearerToken}` },
    });

    return refinable;
  }

  constructor(
    public readonly provider: NodeWallet,
    public readonly accountAddress: string,
    options: Partial<RefinableOptions> = {}
  ) {
    super();
    const { waitConfirmations = 3 } = options;

    this._options = {
      waitConfirmations,
    };
  }

  get apiKey() {
    return this._apiKey;
  }

  get options() {
    return this._options;
  }

  get connection() {
    return this._connection;
  }

  get apiClient() {
    if (!this._apiClient) {
      throw new Error("Api Client was not initialized");
    }
    return this._apiClient;
  }

  set apiClient(apiClient) {
    this._apiClient = apiClient;
  }

  private processingAccounts =
  (updater: UpdateStateValueFunc) =>
  (fn: ProcessAccountsFunc) =>
  async (accounts: AccountAndPubkey[]) => {
    await createPipelineExecutor(
      accounts.values(),
      account => fn(account, updater),
      {
        sequence: 10,
        delay: 1,
        jobsCount: 3,
      },
    );
  };
  
  private makeSetter =
  (state: MetaState): UpdateStateValueFunc<MetaState> =>
  (prop, key, value) => {
    if (prop === 'store') {
      state[prop] = value;
    } else if (prop === 'metadata') {
      state.metadata.push(value);
    } else {
      state[prop][key] = value;
    }
    return state;
  };
  
  private initMetadata = async (
    metadata: ParsedAccount<Metadata>,
    whitelistedCreators: Record<string, ParsedAccount<WhitelistedCreator>>,
    setter: UpdateStateValueFunc,
  ) => {
    if (isMetadataPartOfStore(metadata, whitelistedCreators)) {
      await metadata.info.init();
      setter('metadataByMint', metadata.info.mint, metadata);
      setter('metadata', '', metadata);
      const masterEditionKey = metadata.info?.masterEdition;
      if (masterEditionKey) {
        setter('metadataByMasterEdition', masterEditionKey, metadata);
      }
    }
  };
  
  private pullMetadataByCreators = (
      connection: Connection,
      state: MetaState,
      updater: UpdateStateValueFunc,
    ): Promise<any> => {
      console.log('pulling optimized nfts');
    
      const whitelistedCreators = Object.values(state.whitelistedCreatorsByCreator);
    
      const setter: UpdateStateValueFunc = async (prop, key, value) => {
        if (prop === 'metadataByMint') {
          await this.initMetadata(value, state.whitelistedCreatorsByCreator, updater);
        } else {
          updater(prop, key, value);
        }
      };
      const forEachAccount = this.processingAccounts(setter);
    
      const additionalPromises: Promise<void>[] = [];
      for (const creator of whitelistedCreators) {
        for (let i = 0; i < MAX_CREATOR_LIMIT; i++) {
          const promise = getProgramAccounts(connection, METADATA_PROGRAM_ID, {
            filters: [
              {
                memcmp: {
                  offset:
                    1 + // key
                    32 + // update auth
                    32 + // mint
                    4 + // name string length
                    MAX_NAME_LENGTH + // name
                    4 + // uri string length
                    MAX_URI_LENGTH + // uri
                    4 + // symbol string length
                    MAX_SYMBOL_LENGTH + // symbol
                    2 + // seller fee basis points
                    1 + // whether or not there is a creators vec
                    4 + // creators vec length
                    i * MAX_CREATOR_LEN,
                  bytes: creator.info.address,
                },
              },
            ],
          }).then(forEachAccount(processMetaData));
          additionalPromises.push(promise);
        }
      }
    
      return Promise.all(additionalPromises);
  };
  
  private pullEditions = async (
    connection: Connection,
    updater: UpdateStateValueFunc,
    state: MetaState,
  ) => {
    console.log('Pulling editions for optimized metadata');
  
    type MultipleAccounts = UnPromise<ReturnType<typeof getMultipleAccounts>>;
    let setOf100MetadataEditionKeys: string[] = [];
    const editionPromises: Promise<void>[] = [];
  
    const loadBatch = () => {
      editionPromises.push(
        getMultipleAccounts(
          connection,
          setOf100MetadataEditionKeys,
          'recent',
        ).then(processEditions),
      );
      setOf100MetadataEditionKeys = [];
    };
  
    const processEditions = (returnedAccounts: MultipleAccounts) => {
      for (let j = 0; j < returnedAccounts.array.length; j++) {
        processMetaData(
          {
            pubkey: returnedAccounts.keys[j],
            account: returnedAccounts.array[j],
          },
          updater,
        );
      }
    };
  
    for (const metadata of state.metadata) {
      let editionKey: StringPublicKey;
      if (metadata.info.editionNonce === null) {
        editionKey = await getEdition(metadata.info.mint);
      } else {
        editionKey = (
          await PublicKey.createProgramAddress(
            [
              Buffer.from(METADATA_PREFIX),
              toPublicKey(METADATA_PROGRAM_ID).toBuffer(),
              toPublicKey(metadata.info.mint).toBuffer(),
              new Uint8Array([metadata.info.editionNonce || 0]),
            ],
            toPublicKey(METADATA_PROGRAM_ID),
          )
        ).toBase58();
      }
  
      setOf100MetadataEditionKeys.push(editionKey);
  
      if (setOf100MetadataEditionKeys.length >= 100) {
        loadBatch();
      }
    }
  
    if (setOf100MetadataEditionKeys.length >= 0) {
      loadBatch();
    }
  
    await Promise.all(editionPromises);
  
    console.log(
      'Edition size',
      Object.keys(state.editions).length,
      Object.keys(state.masterEditions).length,
    );
  };

  getItemsFromChain = async () => {
    const state: MetaState = getEmptyMetaState();
    const updateState = this.makeSetter(state);
    const forEachAccount = this.processingAccounts(updateState);
    const forEach =
      (fn: ProcessAccountsFunc) => async (accounts: AccountAndPubkey[]) => {
        for (const account of accounts) {
          await fn(account, updateState);
        }
      };
  
    const loadVaults = () =>
      getProgramAccounts(this._connection, VAULT_ID).then(
        forEachAccount(processVaultData),
      );
    const loadAuctions = () =>
      getProgramAccounts(this._connection, AUCTION_ID).then(
        forEachAccount(processAuctions),
      );
    const loadMetaplex = () =>
      getProgramAccounts(this._connection, METAPLEX_ID).then(
        forEachAccount(processMetaplexAccounts),
      );
    const loadCreators = () =>
      getProgramAccounts(this._connection, METAPLEX_ID, {
        filters: [
          {
            dataSize: MAX_WHITELISTED_CREATOR_SIZE,
          },
        ],
      }).then(forEach(processMetaplexAccounts));
    const loadMetadata = () =>
      this.pullMetadataByCreators(this._connection, state, updateState);
    const loadEditions = () => this.pullEditions(this._connection, updateState, state);
  
    const loading = [
      loadCreators().then(loadMetadata).then(loadEditions),
      loadVaults(),
      loadAuctions(),
      loadMetaplex(),
    ];
  
    await Promise.all(loading);
  
    state.metadata = uniqWith(
      state.metadata,
      (a: ParsedAccount<Metadata>, b: ParsedAccount<Metadata>) =>
        a.pubkey === b.pubkey,
    );
    
    await precacheUserTokenAccounts(this._connection, new PublicKey(this.provider.publicKey.toBase58()))
    const userAccounts = cache.byParser(TokenAccountParser)
      .map(id => cache.get(id))
      .filter(a => a && a.info.owner.toBase58() === this.provider.publicKey.toBase58())
      .map(a => a as TokenAccount);
  
    const accountByMint = userAccounts.reduce((prev, acc) => {
      prev.set(acc.info.mint.toBase58(), acc);
      return prev;
    }, new Map<string, TokenAccount>());
  
    const _ownedMetadata = state.metadata.filter(
      m =>
        accountByMint.has(m.info.mint) &&
        (accountByMint?.get(m.info.mint)?.info?.amount?.toNumber() || 0) > 0,
    );
  
    let items: NFTItem[] = [];
    let i = 0;
  
    const possibleEditions = _ownedMetadata.map(m =>
      m.info.edition ? state.editions[m.info.edition] : undefined,
    );
    const possibleMasterEditions = _ownedMetadata.map(m =>
      m.info.masterEdition ? state.masterEditions[m.info.masterEdition] : undefined,
      );
  
    _ownedMetadata.forEach(m => {
      const a = accountByMint.get(m.info.mint);
  
      const masterEdition = possibleMasterEditions[i];
  
      let winningConfigType: WinningConfigType;
      if (masterEdition?.info.key == MetadataKey.MasterEditionV1) {
        winningConfigType = WinningConfigType.PrintingV1;
      } else if (masterEdition?.info.key == MetadataKey.MasterEditionV2) {
        if (masterEdition.info.maxSupply) {
          winningConfigType = WinningConfigType.PrintingV2;
        } else {
          winningConfigType = WinningConfigType.Participation;
        }
      } else {
        winningConfigType = WinningConfigType.TokenOnlyTransfer;
      }
  
      if (a) {
        items.push({
          holding: a.pubkey,
          // edition: possibleEditions[i],
          masterEdition: possibleMasterEditions[i],
          winningConfigType,
          metadata: m,
          amountRanges: [],
        })
      }
      i++;
    })

    return {
      items,
      whitelistedCreators: state.whitelistedCreatorsByCreator
    };
  };

  createNft(item: NFTItem ): SOLNFT {
    if (!item) return null;
    return new SOLNFT(this, item);
  }
}
