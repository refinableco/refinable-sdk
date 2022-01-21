import { Auction } from "@metaplex-foundation/mpl-auction";
import { Wallet } from "@metaplex/js";
import { Keypair, TransactionInstruction } from "@solana/web3.js";
import {
  createAuction,
  CreateAuctionArgs,
  IPartialCreateAuctionArgs,
} from "../oyster";
import { StringPublicKey } from "../utils";

// This command makes an auction
export async function makeAuction(
  wallet: Wallet,
  vault: StringPublicKey,
  auctionSettings: IPartialCreateAuctionArgs
): Promise<{
  auction: StringPublicKey;
  instructions: TransactionInstruction[];
  signers: Keypair[];
}> {
  if (!wallet.publicKey) throw new Error("Wallet not connected");

  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];

  const auctionKey = (await Auction.getPDA(vault)).toBase58();

  const fullSettings = new CreateAuctionArgs({
    ...auctionSettings,
    authority: wallet.publicKey.toBase58(),
    resource: vault,
  });

  createAuction(fullSettings, wallet.publicKey.toBase58(), instructions);

  return { instructions, signers, auction: auctionKey };
}
