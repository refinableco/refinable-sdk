import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import { u64 } from '@solana/spl-token';
import { TokenAccount } from '../../models';
import { StringPublicKey, WRAPPED_SOL_MINT } from '../../../utils/ids';
import { TokenAccountParser } from './parsesrs';
import { programIds } from '../../../utils';
import { cache } from '../../../contexts/accounts';

function wrapNativeAccount(
  pubkey: StringPublicKey,
  account?: AccountInfo<Buffer>,
): TokenAccount | undefined {
  if (!account) {
    return undefined;
  }

  const key = new PublicKey(pubkey);

  return {
    pubkey: pubkey,
    account,
    info: {
      address: key,
      mint: WRAPPED_SOL_MINT,
      owner: key,
      amount: new u64(account.lamports),
      delegate: null,
      delegatedAmount: new u64(0),
      isInitialized: true,
      isFrozen: false,
      isNative: true,
      rentExemptReserve: null,
      closeAuthority: null,
    },
  };
}

const PRECACHED_OWNERS = new Set<string>();
const precacheUserTokenAccounts = async (
  connection: Connection,
  owner?: PublicKey,
) => {
  if (!owner) {
    return;
  }

  // used for filtering account updates over websocket
  PRECACHED_OWNERS.add(owner.toBase58());

  // user accounts are updated via ws subscription
  const accounts = await connection.getTokenAccountsByOwner(owner, {
    programId: programIds().token,
  });

  accounts.value.forEach(info => {
    cache.add(info.pubkey.toBase58(), info.account, TokenAccountParser);
  });
};

