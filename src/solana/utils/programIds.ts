import { PublicKey } from '@solana/web3.js';
import {
  METADATA_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  METAPLEX_ID,
  BPF_UPGRADE_LOADER_ID,
  SYSTEM,
  MEMO_ID,
  VAULT_ID,
  AUCTION_ID,
  toPublicKey,
} from './ids';
import { findProgramAddress } from './utils';

export const getStoreID = async (storeOwnerAddress?: string) => {
  if (!storeOwnerAddress) {
    return undefined;
  }

  console.log('Store owner', storeOwnerAddress, METAPLEX_ID);
  const programs = await findProgramAddress(
    [
      Buffer.from('metaplex'),
      toPublicKey(METAPLEX_ID).toBuffer(),
      toPublicKey(storeOwnerAddress).toBuffer(),
    ],
    toPublicKey(METAPLEX_ID),
  );
  const storeAddress = programs[0];

  return storeAddress;
};

export const setProgramIds = async (store?: string) => {
  STORE = store ? toPublicKey(store) : undefined;
};

let STORE: PublicKey = new PublicKey('7ZSVESLw6EyTNbX71y5YGuQTxxyHuwReEp9Uw8ype7Ua')

export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    bpf_upgrade_loader: BPF_UPGRADE_LOADER_ID,
    system: SYSTEM,
    metadata: METADATA_PROGRAM_ID,
    memo: MEMO_ID,
    vault: VAULT_ID,
    auction: AUCTION_ID,
    metaplex: METAPLEX_ID,
    store: STORE,
  };
};