import {
  Keypair,
  clusterApiUrl,
  Commitment,
  Connection,
  RpcResponseAndContext,
  SignatureStatus,
  SimulatedTransactionResponse,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
  Blockhash,
  FeeCalculator,
  PublicKey,
} from '@solana/web3.js';
import { uniqWith } from 'lodash';
import { WhitelistedCreator } from '../../models/metaplex';
import { isMetadataPartOfStore } from './isMetadataPartOfStore';
import { processMetaData } from './processMetaData'
import { getMultipleAccounts } from '../accounts/getMultipleAccounts';
import {
  TokenInfo,
  TokenListProvider,
  ENV as ChainId,
} from '@solana/spl-token-registry';
import { getEmptyMetaState } from './getEmptyMetaState';
import { getProgramAccounts } from './web3';
import { createPipelineExecutor } from '../../utils/createPipelineExecutor';
import { processVaultData } from './processVaultData';
import { processAuctions } from './processAuctions';
import { processMetaplexAccounts } from './processMetaplexAccounts'
import { MAX_WHITELISTED_CREATOR_SIZE } from '../../models';
import {
  getEdition,
  Metadata,
  MAX_CREATOR_LEN,
  MAX_CREATOR_LIMIT,
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_URI_LENGTH,
  METADATA_PREFIX,
  decodeMetadata,
  getAuctionExtended,
} from '../../actions';
import {
  AccountAndPubkey,
  MetaState,
  ProcessAccountsFunc,
  UpdateStateValueFunc,
  UnPromise,
} from './types';

import { ParsedAccount } from '../accounts/types';
import fs from 'fs'
import {
  AUCTION_ID,
  METADATA_PROGRAM_ID,
  METAPLEX_ID,
  StringPublicKey,
  toPublicKey,
  VAULT_ID,
} from '../../utils/ids';

export type ENV =
  | 'mainnet-beta'
  | 'mainnet-beta (Solana)'
  | 'mainnet-beta (Serum)'
  | 'testnet'
  | 'devnet'
  | 'localnet'
  | 'lending';

export const ENDPOINTS = [
  {
    name: 'mainnet-beta' as ENV,
    endpoint: 'https://api.metaplex.solana.com/',
    ChainId: ChainId.MainnetBeta,
  },
  {
    name: 'mainnet-beta (Solana)' as ENV,
    endpoint: 'https://api.mainnet-beta.solana.com',
    ChainId: ChainId.MainnetBeta,
  },
  {
    name: 'mainnet-beta (Serum)' as ENV,
    endpoint: 'https://solana-api.projectserum.com/',
    ChainId: ChainId.MainnetBeta,
  },
  {
    name: 'testnet' as ENV,
    endpoint: clusterApiUrl('testnet'),
    ChainId: ChainId.Testnet,
  },
  {
    name: 'devnet' as ENV,
    endpoint: clusterApiUrl('devnet'),
    ChainId: ChainId.Devnet,
  },
];

const DEFAULT = ENDPOINTS[ENDPOINTS.length-1].endpoint;

const connection = new Connection(DEFAULT, 'recent');

export const processingAccounts =
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

export const makeSetter =
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

export const initMetadata = async (
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

const pullMetadataByCreators = (
    connection: Connection,
    state: MetaState,
    updater: UpdateStateValueFunc,
  ): Promise<any> => {
    console.log('pulling optimized nfts');
  
    const whitelistedCreators = Object.values(state.whitelistedCreatorsByCreator);
  
    const setter: UpdateStateValueFunc = async (prop, key, value) => {
      if (prop === 'metadataByMint') {
        // console.log('1111111');
        
        await initMetadata(value, state.whitelistedCreatorsByCreator, updater);
      } else {
        // console.log('1222222');

        updater(prop, key, value);
      }
    };
    const forEachAccount = processingAccounts(setter);
  
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

const pullEditions = async (
  connection: Connection,
  updater: UpdateStateValueFunc,
  state: MetaState,
) => {
  console.log('Pulling editions for optimized metadata');

  
  // console.log('metadata: ', state.metadata);
  

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
      // console.log('setOf100MetadataEditionKeys: ', setOf100MetadataEditionKeys);

      loadBatch();
    }
  }

  if (setOf100MetadataEditionKeys.length >= 0) {
    // console.log('setOf100MetadataEditionKeys: ', setOf100MetadataEditionKeys);
    
    loadBatch();
  }

  await Promise.all(editionPromises);

  console.log(
    'Edition size',
    Object.keys(state.editions).length,
    Object.keys(state.masterEditions).length,
  );
};

export const loadAccounts = async (connection: Connection) => {
  const state: MetaState = getEmptyMetaState();
  const updateState = makeSetter(state);
  const forEachAccount = processingAccounts(updateState);
  const forEach =
    (fn: ProcessAccountsFunc) => async (accounts: AccountAndPubkey[]) => {
      for (const account of accounts) {
        // console.log('account: ', account);
        
        await fn(account, updateState);
      }
    };

  const loadVaults = () =>
    getProgramAccounts(connection, VAULT_ID).then(
      forEachAccount(processVaultData),
    );
  const loadAuctions = () =>
    getProgramAccounts(connection, AUCTION_ID).then(
      forEachAccount(processAuctions),
    );
  const loadMetaplex = () =>
    getProgramAccounts(connection, METAPLEX_ID).then(
      forEachAccount(processMetaplexAccounts),
    );
  const loadCreators = () =>
    getProgramAccounts(connection, METAPLEX_ID, {
      filters: [
        {
          dataSize: MAX_WHITELISTED_CREATOR_SIZE,
        },
      ],
    }).then(forEach(processMetaplexAccounts));
  const loadMetadata = () =>
    pullMetadataByCreators(connection, state, updateState);
  const loadEditions = () => pullEditions(connection, updateState, state);

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

  // const proc = require('child_process').spawn('pbcopy'); 
  // proc.stdin.write(JSON.stringify(state)); proc.stdin.end();
  fs.writeFile('data.txt', JSON.stringify(state), ()=>{});

    // console.log(state.metadataByMint);
    const mints = []
    for (const [mint, metadata] of Object.entries(state.metadataByMint)) {
      if (metadata.info.data.creators.some(c=>c.address==='2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT')) {
        // mints.push(metadata)
        console.log(metadata.info.data.uri);
        
      }
    }

    // console.log(mints);
    


  return state;
};

loadAccounts(connection)