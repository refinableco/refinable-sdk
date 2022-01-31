import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  AUCTION_ID,
  BPF_UPGRADE_LOADER_ID,
  MEMO_ID,
  METADATA_PROGRAM_ID,
  METAPLEX_ID,
  SYSTEM,
  VAULT_ID,
} from "./ids";

export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    associatedToken: ASSOCIATED_TOKEN_PROGRAM_ID,
    bpf_upgrade_loader: BPF_UPGRADE_LOADER_ID,
    system: SYSTEM,
    metadata: METADATA_PROGRAM_ID,
    memo: MEMO_ID,
    vault: VAULT_ID,
    auction: AUCTION_ID,
    metaplex: METAPLEX_ID,
  };
};
