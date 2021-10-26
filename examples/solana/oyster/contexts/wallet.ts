import { WalletAdapter, WalletError } from '@solana/wallet-adapter-base';
import {
  useWallet,
  WalletProvider as BaseWalletProvider,
} from '@solana/wallet-adapter-react';
import {
  getLedgerWallet,
  getMathWallet,
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolongWallet,
  getTorusWallet,
  WalletName,
} from '@solana/wallet-adapter-wallets';
import { Button } from 'antd';

export interface WalletModalContextState {
  visible: boolean;
  setVisible: (open: boolean) => void;
}

export type WalletSigner = Pick<
  WalletAdapter,
  'publicKey' | 'signTransaction' | 'signAllTransactions'
>;
