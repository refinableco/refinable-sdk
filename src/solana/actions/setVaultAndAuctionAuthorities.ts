import { Wallet } from "@metaplex/js";
import { Keypair, TransactionInstruction } from "@solana/web3.js";
import { setAuctionAuthority, setVaultAuthority } from "../oyster";
import { StringPublicKey } from "../utils";

// This command sets the authorities on the vault and auction to be the newly created auction manager.
export async function setVaultAndAuctionAuthorities(
  wallet: Wallet,
  vault: StringPublicKey,
  auction: StringPublicKey,
  auctionManager: StringPublicKey
): Promise<{
  instructions: TransactionInstruction[];
  signers: Keypair[];
}> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];

  await setAuctionAuthority(
    auction,
    wallet.publicKey.toBase58(),
    auctionManager,
    instructions
  );
  await setVaultAuthority(
    vault,
    wallet.publicKey.toBase58(),
    auctionManager,
    instructions
  );

  return { instructions, signers };
}
