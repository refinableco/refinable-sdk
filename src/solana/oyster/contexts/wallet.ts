import { WalletAdapter } from '@solana/wallet-adapter-base';

export interface WalletModalContextState {
  visible: boolean;
  setVisible: (open: boolean) => void;
}

export type WalletSigner = Pick<
  WalletAdapter,
  'publicKey' | 'signTransaction' | 'signAllTransactions'
>;
