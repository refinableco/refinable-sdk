import { SignerWalletAdapter } from '@solana/wallet-adapter-base';

export interface WalletModalContextState {
  visible: boolean;
  setVisible: (open: boolean) => void;
}

export type WalletSigner = SignerWalletAdapter;
