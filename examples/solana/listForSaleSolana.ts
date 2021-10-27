import {
  Keypair,
  clusterApiUrl,
  Connection,
  Transaction,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { uniqWith } from 'lodash';
import BN from 'bn.js';
import {
  ENV as ChainId,
} from '@solana/spl-token-registry';
import { createPipelineExecutor } from './utils/createPipelineExecutor';
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
  getMultipleAccounts,
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
} from './oyster';

import { ParsedAccount } from './oyster/contexts/accounts/types';
import {
  AUCTION_ID,
  METADATA_PROGRAM_ID,
  METAPLEX_ID,
  StringPublicKey,
  toPublicKey,
  VAULT_ID,
} from './utils/ids';

import {createAuctionManager,SafetyDepositDraft} from './actions/createAuctionManager'


import {
  IPartialCreateAuctionArgs,
  WinnerLimit,
  WinnerLimitType,
  PriceFloor,
  PriceFloorType,
} from './oyster';
import {
  WinningConfigType,
  AmountRange,
} from './oyster';
import { QUOTE_MINT } from './constants';
import { NodeWallet } from './wallet';
import base58 from 'bs58';
import { getProgramAccounts } from './oyster/contexts/meta/web3';
import { getEmptyMetaState } from './oyster/contexts/meta/getEmptyMetaState';

interface TierDummyEntry {
  safetyDepositBoxIndex: number;
  amount: number;
  winningConfigType: WinningConfigType;
}

interface Tier {
  items: (TierDummyEntry | {})[];
  winningSpots: number[];
}

interface AuctionState {
  // Min price required for the item to sell
  reservationPrice: number;

  // listed NFTs
  // items: SafetyDepositDraft[];
  items: any;
  participationNFT?: SafetyDepositDraft;
  participationFixedPrice?: number;
  // number of editions for this auction (only applicable to limited edition)
  editions?: number;

  // date time when auction should start UTC+0
  startDate?: Date;

  // suggested date time when auction should end UTC+0
  endDate?: Date;

  //////////////////
  category: AuctionCategory;

  price?: number;
  priceFloor?: number;
  priceTick?: number;

  startSaleTS?: number;
  startListTS?: number;
  endTS?: number;

  auctionDuration?: number;
  auctionDurationType?: 'days' | 'hours' | 'minutes';
  gapTime?: number;
  gapTimeType?: 'days' | 'hours' | 'minutes';
  tickSizeEndingPhase?: number;

  spots?: number;
  tiers?: Array<Tier>;

  winnersCount: number;

  instantSalePrice?: number;
}

enum AuctionCategory {
  InstantSale,
  Limited,
  Single,
  Open,
  Tiered,
}
interface Wallet {
  publicKey: PublicKey;
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
}
// declare class NodeWallet implements Wallet {
//   readonly payer: Keypair;
//   constructor(payer: Keypair);
//   signTransaction(tx: Transaction): Promise<Transaction>;
//   signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
//   get publicKey(): PublicKey;
// }

type ENV =
  | 'mainnet-beta'
  | 'mainnet-beta (Solana)'
  | 'mainnet-beta (Serum)'
  | 'testnet'
  | 'devnet'
  | 'localnet'
  | 'lending';

const ENDPOINTS = [
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

const processingAccounts =
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

const makeSetter =
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

const initMetadata = async (
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

const loadAccounts = async (connection: Connection) => {
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
  // fs.writeFile('data.txt', JSON.stringify(state), ()=>{});

    // console.log(state.metadataByMint);
    const mints = []
    for (const [mint, metadata] of Object.entries(state.metadataByMint)) {
      if (metadata.info.data.creators.some(c=>c.address==='2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT')) {
        mints.push(metadata)
        // console.log(metadata.info.data.uri);
        // state.metadataByMint
        
      }
    }

    const ownedMetadata = state.metadata.filter(
      m => {
        if (state.metadataByMint[m.info.mint] && m.info.primarySaleHappened) return true
        else return false;
      }
      // && (state.metadataByMint?.get(m.info.mint)?.info?.amount?.toNumber() || 0) > 0,
    );

    if (!ownedMetadata.length) {
      throw new Error('No items available for sale')
    }

    console.log('ownedMetadata: ', JSON.stringify(ownedMetadata[0]));
    



    

    // console.log('state.metadataByMint: ', JSON.stringify(state.metadataByMint));
    
    // return

    const byte_array = base58.decode('5G94Azn6n9VMjVPpop6oyAj21ZvL27oY89TGhhGx7qbWoQ9mKcku7Qo4sL2qbsgvabNsFqa7iU8TSp2vGN5XcyZP')
    
    const payer = Keypair.fromSecretKey(
      byte_array
    );

    const wallet = new NodeWallet(payer);

    const attributes: AuctionState = {
      reservationPrice: 0,
      // items: [{"holding":"JDg3b2jHXf9L3Z9urhZ7vSnnAHLTkQ1aAe3NYmesePxe","masterEdition":{"pubkey":"GYZALqnjnjKKkTBMvK9JUQ9TxLumoSZDG9MLZ9qumbHQ","account":{"executable":false,"lamports":2853600,"owner":"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s","rentEpoch":206,"data":{"type":"Buffer","data":[6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},"info":{"key":6,"supply":"00"}},"metadata":{"pubkey":"BJs1HrxAeQ4TVDYMZMCXMVAG2439fhaxgFJodWYuYjF3","account":{"data":{"type":"Buffer","data":[4,28,184,136,170,74,33,40,136,127,181,104,233,195,7,31,138,16,68,104,177,78,56,28,61,231,98,107,79,238,179,108,206,21,254,162,3,8,76,172,79,36,203,85,27,252,33,74,32,74,132,220,129,248,143,144,4,102,37,232,112,86,182,252,162,32,0,0,0,117,121,106,103,106,103,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,200,0,0,0,104,116,116,112,115,58,47,47,97,114,119,101,97,118,101,46,110,101,116,47,101,75,122,57,82,72,110,97,48,65,85,81,109,113,110,104,83,121,71,70,83,105,98,112,65,89,98,51,65,118,71,86,102,78,85,115,48,48,49,111,105,89,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,28,184,136,170,74,33,40,136,127,181,104,233,195,7,31,138,16,68,104,177,78,56,28,61,231,98,107,79,238,179,108,206,1,100,0,1,1,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"executable":false,"lamports":5616720,"owner":"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"},"info":{"key":4,"updateAuthority":"2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT","mint":"2Urm6TkUaCo5jkiJNqFXGdGApeVCkCGLJvVmAN3y5kVX","data":{"name":"uyjgjg","symbol":"","uri":"https://arweave.net/eKz9RHna0AUQmqnhSyGFSibpAYb3AvGVfNUs001oiY8","sellerFeeBasisPoints":0,"creators":[{"address":"2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT","verified":1,"share":100}]},"primarySaleHappened":0,"isMutable":1,"editionNonce":null,"edition":"GYZALqnjnjKKkTBMvK9JUQ9TxLumoSZDG9MLZ9qumbHQ","masterEdition":"GYZALqnjnjKKkTBMvK9JUQ9TxLumoSZDG9MLZ9qumbHQ"}},"winningConfigType":4,"amountRanges":[],"participationConfig":{"winnerConstraint":1,"nonWinningConstraint":1,"fixedPrice":"00"}}],
      // items: [{"holding":"8FjdMMFmZtumHS3EF3L6g1ebJuhphYUbHGFZA42bq1ep","edition":{"pubkey":"CQZE98Dy7ubNqRDbrmavr8jDyFxBz1GewsiZm5tWJ2pu","account":{"lamports":2568240,"data":{"type":"Buffer","data":[1,132,116,62,28,3,197,101,51,126,239,186,222,190,84,62,154,123,152,122,26,169,37,157,3,231,218,112,39,37,33,119,48,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"owner":"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s","executable":false,"rentEpoch":208},"info":{"key":1,"parent":"9v3d4GoYrmU1RmG5ceEySmjg7TSyuWv9gkNtzxKQvsDy","edition":"01"}},"metadata":{"pubkey":"9aagW9hnX88J9NwCeDtW7TMHuB67cgv82BkHPxghw2gW","account":{"lamports":5616720,"data":{"type":"Buffer","data":[4,28,184,136,170,74,33,40,136,127,181,104,233,195,7,31,138,16,68,104,177,78,56,28,61,231,98,107,79,238,179,108,206,155,55,18,47,53,216,235,35,133,49,209,224,160,48,82,249,63,132,79,138,169,175,235,81,224,166,98,30,168,215,58,229,32,0,0,0,49,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,200,0,0,0,104,116,116,112,115,58,47,47,97,114,119,101,97,118,101,46,110,101,116,47,116,85,75,45,101,79,104,117,114,51,84,106,118,95,54,87,117,110,70,85,85,103,106,107,98,121,81,53,87,77,50,81,76,52,75,109,72,81,112,107,90,109,69,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100,0,1,1,0,0,0,28,184,136,170,74,33,40,136,127,181,104,233,195,7,31,138,16,68,104,177,78,56,28,61,231,98,107,79,238,179,108,206,1,100,0,0,1,251,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"owner":"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s","executable":false,"rentEpoch":208},"info":{"key":4,"updateAuthority":"2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT","mint":"BStu6j4kKgby3aVgNQj5MeZsDMb13CcdshBpGyADKZ8Y","data":{"name":"1","symbol":"","uri":"https://arweave.net/tUK-eOhur3Tjv_6WunFUUgjkbyQ5WM2QL4KmHQpkZmE","sellerFeeBasisPoints":100,"creators":[{"address":"2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT","verified":1,"share":100}]},"primarySaleHappened":0,"isMutable":0,"editionNonce":null,"edition":"CQZE98Dy7ubNqRDbrmavr8jDyFxBz1GewsiZm5tWJ2pu","masterEdition":"CQZE98Dy7ubNqRDbrmavr8jDyFxBz1GewsiZm5tWJ2pu"}},"winningConfigType":0,"amountRanges":[]}],
      items: [{"holding":"FJSA7N2FBGpHJN4nAEtxYRzLQp7V57WCEvXrZryFmE2M","masterEdition":{"pubkey":"8XVon7bKZeUP6ZsmwHtihsCBY2dJmm3bwjAVnq2FwwjK","account":{"lamports":2853600,"data":{"type":"Buffer","data":[6,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"owner":"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s","executable":false,"rentEpoch":208},"info":{"key":6,"supply":"00","maxSupply":"01"}},"metadata":{"pubkey":"CM9hZL9qwoFmWXVvpUPRqB8uHua3YXDnhpZKuE7NPX3p","account":{"lamports":5616720,"data":{"type":"Buffer","data":[4,28,184,136,170,74,33,40,136,127,181,104,233,195,7,31,138,16,68,104,177,78,56,28,61,231,98,107,79,238,179,108,206,44,81,199,39,32,252,206,5,144,144,231,251,66,221,142,119,162,164,14,174,5,209,220,199,203,241,242,166,86,226,212,42,32,0,0,0,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,200,0,0,0,104,116,116,112,115,58,47,47,97,114,119,101,97,118,101,46,110,101,116,47,68,48,72,110,106,108,109,114,52,122,121,75,72,75,108,121,73,57,57,99,104,56,110,56,78,99,121,98,122,80,104,111,57,77,100,116,104,50,97,115,78,51,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100,0,1,1,0,0,0,28,184,136,170,74,33,40,136,127,181,104,233,195,7,31,138,16,68,104,177,78,56,28,61,231,98,107,79,238,179,108,206,1,100,0,1,1,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"owner":"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s","executable":false,"rentEpoch":208},"info":{"key":4,"updateAuthority":"2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT","mint":"3z1GHWGDpYXXrXgWyN28roCE7FuAo4p2Tki4SJkUJrZF","data":{"name":"2","symbol":"","uri":"https://arweave.net/D0Hnjlmr4zyKHKlyI99ch8n8NcybzPho9Mdth2asN3c","sellerFeeBasisPoints":100,"creators":[{"address":"2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT","verified":1,"share":100}]},"primarySaleHappened":0,"isMutable":1,"editionNonce":null,"edition":"8XVon7bKZeUP6ZsmwHtihsCBY2dJmm3bwjAVnq2FwwjK","masterEdition":"8XVon7bKZeUP6ZsmwHtihsCBY2dJmm3bwjAVnq2FwwjK"}},"winningConfigType":3,"amountRanges":[]}],

      category: AuctionCategory.InstantSale,
      auctionDurationType: 'minutes',
      gapTimeType: 'minutes',
      winnersCount: 1,
      startSaleTS: new Date().getTime(),
      startListTS: new Date().getTime(),
      instantSalePrice: 1,
      priceFloor: 1
    }

    const isInstantSale =
    attributes.instantSalePrice &&
    attributes.priceFloor === attributes.instantSalePrice;

    let winnerLimit: WinnerLimit;

    if (attributes.items.length > 0) {
      const item = attributes.items[0];
      if (!attributes.editions) {
        item.winningConfigType =
          item.metadata.info.updateAuthority ===
          (wallet?.publicKey || SystemProgram.programId).toBase58()
            ? WinningConfigType.FullRightsTransfer
            : WinningConfigType.TokenOnlyTransfer;
      }
      item.amountRanges = [
        new AmountRange({
          amount: new BN(1),
          length: new BN(attributes.editions || 1),
        }),
      ];
    }
    winnerLimit = new WinnerLimit({
      type: WinnerLimitType.Capped,
      usize: new BN(attributes.editions || 1),
    });

    const auctionSettings: IPartialCreateAuctionArgs = {
      winners: winnerLimit,
      endAuctionAt: isInstantSale
        ? null
        : new BN(
            (attributes.auctionDuration || 0) *
              (attributes.auctionDurationType == 'days'
                ? 60 * 60 * 24 // 1 day in seconds
                : attributes.auctionDurationType == 'hours'
                ? 60 * 60 // 1 hour in seconds
                : 60), // 1 minute in seconds
          ), // endAuctionAt is actually auction duration, poorly named, in seconds
      auctionGap: isInstantSale
        ? null
        : new BN(
            (attributes.gapTime || 0) *
              (attributes.gapTimeType == 'days'
                ? 60 * 60 * 24 // 1 day in seconds
                : attributes.gapTimeType == 'hours'
                ? 60 * 60 // 1 hour in seconds
                : 60), // 1 minute in seconds
          ),
      priceFloor: new PriceFloor({
        // type: attributes.priceFloor
        //   ? PriceFloorType.Minimum
        //   : PriceFloorType.None,
        type: PriceFloorType.Minimum,
        minPrice: new BN((attributes.priceFloor || 0) * LAMPORTS_PER_SOL),
      }),
      tokenMint: QUOTE_MINT.toBase58(),
      gapTickSizePercentage: attributes.tickSizeEndingPhase || null,
      tickSize: attributes.priceTick
        ? new BN(attributes.priceTick * LAMPORTS_PER_SOL)
        : null,
      instantSalePrice: attributes.instantSalePrice
        ? new BN((attributes.instantSalePrice || 0) * LAMPORTS_PER_SOL)
        : null,
      name: null,
    };

    const tieredAttributes = {
      items: [],
      tiers: [],
    }

    const whitelistedCreatorsByCreator = {"2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT":{"pubkey":"5MFuPf76NPL5pTBBZiqkDTbVBeekeKvufCWJYTm823BF","account":{"data":{"type":"Buffer","data":[4,28,184,136,170,74,33,40,136,127,181,104,233,195,7,31,138,16,68,104,177,78,56,28,61,231,98,107,79,238,179,108,206,1,0,0,0,0,0,0,0,0,0,0]},"executable":false,"lamports":1197120,"owner":"p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98"},"info":{"key":4,"activated":1,"address":"2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT"}}}

    // const whitelistedCreatorsByCreator: Record<string,ParsedAccount<WhitelistedCreator>> = {'2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT':}

    createAuctionManager(connection,wallet, whitelistedCreatorsByCreator, auctionSettings,       
      attributes.category === AuctionCategory.Open
        ? []
        : attributes.category !== AuctionCategory.Tiered
        ? attributes.items
        : tieredAttributes.items,
      attributes.category === AuctionCategory.Open
        ? attributes.items[0]
        : attributes.participationNFT,
      QUOTE_MINT.toBase58());

  return state;
};

loadAccounts(connection)