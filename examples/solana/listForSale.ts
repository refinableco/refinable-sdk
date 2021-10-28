import { getItemsAndPutFirstItemOnSale } from '../../src/solana/listForSaleSolana'
import dotenv from "dotenv";
import { ENV as ChainId } from '@solana/spl-token-registry';
import { clusterApiUrl, Connection } from '@solana/web3.js';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const SOL_PUBLIC_KEY = process.env.SOL_PUBLIC_KEY as string;
const SOL_SECRET_KEY = process.env.SOL_SECRET_KEY as string;

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

getItemsAndPutFirstItemOnSale(connection, SOL_PUBLIC_KEY, SOL_SECRET_KEY)