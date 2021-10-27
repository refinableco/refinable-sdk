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
const fs = import('fs')
import { precacheUserTokenAccounts } from './oyster/contexts/accounts'
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
} from './oyster';

import {TokenAccountParser} from './oyster/contexts/accounts/parsesrs'

import {getMultipleAccounts} from './oyster/contexts/accounts/getMultipleAccounts'

import { ParsedAccount } from './oyster/contexts/accounts/types';





import {
  AUCTION_ID,
  // METADATA_PROGRAM_ID,
  METAPLEX_ID,
  StringPublicKey,
  toPublicKey,
  VAULT_ID,
} from './utils/ids';

import {METADATA_PROGRAM_ID} from './utils/ids'

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
import { cache } from './contexts/accounts';

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
        await initMetadata(value, state.whitelistedCreatorsByCreator, updater);
      } else {
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

const loadAccounts = async (connection: Connection) => {
  const state: MetaState = getEmptyMetaState();
  const updateState = makeSetter(state);
  const forEachAccount = processingAccounts(updateState);
  const forEach =
    (fn: ProcessAccountsFunc) => async (accounts: AccountAndPubkey[]) => {
      for (const account of accounts) {
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
    await precacheUserTokenAccounts(connection, new PublicKey('2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT'))
    const userAccounts = cache.byParser(TokenAccountParser)
    .map(id => cache.get(id))
    .filter(a => a && a.info.owner.toBase58() === '2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT')
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

  let items = [];
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

    items = [items[0]]
    console.log('items to sell: ', JSON.stringify(items));

    const byte_array = base58.decode('5G94Azn6n9VMjVPpop6oyAj21ZvL27oY89TGhhGx7qbWoQ9mKcku7Qo4sL2qbsgvabNsFqa7iU8TSp2vGN5XcyZP')
    
    const payer = Keypair.fromSecretKey(
      byte_array
    );

    const wallet = new NodeWallet(payer);

    const attributes: AuctionState = {
      reservationPrice: 0,
      // items: [{"holding":"ABLj17hFzoQVpzj9iMu1yKfBCxNoetBpwE3AKFaqr29b","masterEdition":{"pubkey":"9nVY2XmKbBXdxnW6F6Nqv8SM4P4dzZ8SGzsfbc6BMQsf","account":{"executable":false,"lamports":2853600,"owner":"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s","rentEpoch":208,"data":{"type":"Buffer","data":[6,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},"info":{"key":6,"supply":"00","maxSupply":"01"}},"metadata":{"pubkey":"6pMnEsNacqJksckvbjqHMGnNLpdJv36auSnsmrc9hWBM","account":{"data":{"type":"Buffer","data":[4,28,184,136,170,74,33,40,136,127,181,104,233,195,7,31,138,16,68,104,177,78,56,28,61,231,98,107,79,238,179,108,206,180,47,126,186,129,193,96,241,173,40,223,158,216,213,170,64,197,65,245,159,152,117,61,168,68,29,141,207,113,29,217,185,32,0,0,0,51,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,200,0,0,0,104,116,116,112,115,58,47,47,97,114,119,101,97,118,101,46,110,101,116,47,53,73,100,97,51,57,45,86,102,112,67,100,98,48,53,72,53,70,69,50,90,84,45,73,83,97,117,51,56,109,102,76,70,83,79,116,88,103,87,51,74,67,81,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100,0,1,1,0,0,0,28,184,136,170,74,33,40,136,127,181,104,233,195,7,31,138,16,68,104,177,78,56,28,61,231,98,107,79,238,179,108,206,1,100,0,1,1,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]},"executable":false,"lamports":5616720,"owner":"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"},"info":{"key":4,"updateAuthority":"2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT","mint":"D8NPeTZkPog5M69JQ7ZEDjHWitBjvNM4jB1Vamz6o1Eg","data":{"name":"3","symbol":"","uri":"https://arweave.net/5Ida39-VfpCdb05H5FE2ZT-ISau38mfLFSOtXgW3JCQ","sellerFeeBasisPoints":100,"creators":[{"address":"2w7cres1zQ8yNBHpxfLWw9EaJAHfDThHnJkLNwvJQ9XT","verified":1,"share":100}]},"primarySaleHappened":0,"isMutable":1,"editionNonce":null,"edition":"9nVY2XmKbBXdxnW6F6Nqv8SM4P4dzZ8SGzsfbc6BMQsf","masterEdition":"9nVY2XmKbBXdxnW6F6Nqv8SM4P4dzZ8SGzsfbc6BMQsf"}},"winningConfigType":3,"amountRanges":[]}],
      items,

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
        // item.winningConfigType =
        //   item.metadata.info.updateAuthority ===
        //   (wallet?.publicKey || SystemProgram.programId).toBase58()
        //     ? WinningConfigType.FullRightsTransfer
        //     : WinningConfigType.TokenOnlyTransfer;
        item.winningConfigType = WinningConfigType.TokenOnlyTransfer
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