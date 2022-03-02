import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { Buffer } from "buffer";
import { Chain } from "..";
import { solanaAuctionHouseAuthority } from "../config/solana";
import { toPublicKey } from "./utils";

export const AUCTION_HOUSE_PROGRAM_ID = new PublicKey(
  "FineRZwrZJxL4cd3vvjqeD4L5QtTohFCVJja22q5SCYg"
);

const PREFIX = Buffer.from("auction_house");
const SIGNER = Buffer.from("signer");

export const getAuctionHouseKey = async (
  chain: Chain,
  treasuryMint: PublicKey
) => {
  const authority = solanaAuctionHouseAuthority[chain];
  const [auctionHouse] = await PublicKey.findProgramAddress(
    [PREFIX, authority.toBuffer(), treasuryMint.toBuffer()],
    AUCTION_HOUSE_PROGRAM_ID
  );

  return auctionHouse;
};
export const getProgramAsSigner = async () => {
  return PublicKey.findProgramAddress(
    [PREFIX, SIGNER],
    AUCTION_HOUSE_PROGRAM_ID
  );
};

export const getBuyerEscrow = async (
  auctionHouse: PublicKey,
  buyer: string
) => {
  return PublicKey.findProgramAddress(
    [PREFIX, auctionHouse.toBuffer(), toPublicKey(buyer).toBuffer()],
    AUCTION_HOUSE_PROGRAM_ID
  );
};

export const getPriceWithMantissa = async (
  price: number,
  mint: PublicKey,
  wallet: any,
  connection: Connection
): Promise<number> => {
  const token = new Token(
    connection,
    new PublicKey(mint),
    TOKEN_PROGRAM_ID,
    wallet
  );

  const mintInfo = await token.getMintInfo();

  const mantissa = 10 ** mintInfo.decimals;

  return Math.ceil(price * mantissa);
};

export const getAuctionHouseTradeState = async (
  auctionHouse: PublicKey,
  wallet: PublicKey,
  tokenAccount: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  tokenSize: BN,
  buyPrice: BN
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [
      PREFIX,
      wallet.toBuffer(),
      auctionHouse.toBuffer(),
      tokenAccount.toBuffer(),
      treasuryMint.toBuffer(),
      tokenMint.toBuffer(),
      buyPrice.toArrayLike(Buffer, "le", 8),
      tokenSize.toArrayLike(Buffer, "le", 8),
    ],
    AUCTION_HOUSE_PROGRAM_ID
  );
};

export const getSellerTradeStates = async (params: {
  seller: string;
  auctionHouse: PublicKey;
  sellerTokenAccount: PublicKey;
  treasuryMint: PublicKey;
  tokenId: string;
  buyerPrice: BN;
  tokenSize: u64;
}) => {
  const zero = new u64(0);

  const [sellerTradeState, sellerTradeStateBump] =
    await getAuctionHouseTradeState(
      params.auctionHouse,
      toPublicKey(params.seller),
      params.sellerTokenAccount,
      params.treasuryMint,
      toPublicKey(params.tokenId),
      params.tokenSize,
      params.buyerPrice
    );

  const [freeSellerTradeState, freeSellerTradeStateBump] =
    await getAuctionHouseTradeState(
      params.auctionHouse,
      toPublicKey(params.seller),
      params.sellerTokenAccount,
      params.treasuryMint,
      toPublicKey(params.tokenId),
      params.tokenSize,
      zero
    );

  return {
    sellerTradeState,
    sellerTradeStateBump,
    freeSellerTradeState,
    freeSellerTradeStateBump,
  };
};

export const getRemainingAccounts = async (
  connection: Connection,
  metadataPDA: PublicKey,
  isNative: boolean,
  treasuryMint: PublicKey
) => {
  const remainingAccounts = [];

  const metadataData = await Metadata.load(connection, metadataPDA);

  if (
    metadataData.data.data?.creators &&
    Array.isArray(metadataData.data.data.creators)
  ) {
    for (let i = 0; i < metadataData.data.data.creators.length; i++) {
      remainingAccounts.push({
        pubkey: toPublicKey(metadataData.data.data.creators[i].address),
        isWritable: true,
        isSigner: false,
      });
      if (!isNative) {
        remainingAccounts.push({
          pubkey: (
            await Token.getAssociatedTokenAddress(
              ASSOCIATED_TOKEN_PROGRAM_ID,
              TOKEN_PROGRAM_ID,
              treasuryMint,
              remainingAccounts[remainingAccounts.length - 1].pubkey
            )
          )[0],
          isWritable: true,
          isSigner: false,
        });
      }
    }
  }

  return remainingAccounts;
};
