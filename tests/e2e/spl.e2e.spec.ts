import { Wallet } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  Chain,
  Environment,
  OfferType,
  PriceCurrency,
  RefinableSolanaClient,
  SaleOffer,
} from "../../src";
import { sleep, toLamports, toPublicKey } from "../../src/solana/utils";
import { mintNFT } from "../helpers/metaplex";
import userPrivateKey from "./secrets/test-user.json";
import buyerPrivateKey from "./secrets/test-buyer.json";
import { SPLNFT } from "../../src/nft/SPLNFT";
import SolanaTransaction from "../../src/transaction/SolanaTransaction";

/**
 * Warning:
 * To be able to run the tests, whitelist should be disabled. For this, please run the monorepo with SOLANA_RPC_WHITELIST_DISABLE=1
 */

// Seller: FEnpZJYSECJskBxNPYtc2Weap6iFNRCfkjUydKTu341B
// Buyer: ASXxk71173iRAoGSGBRzuogtax5CRPougEyei28szLNH
export const airdrop = async (connection: Connection, address: PublicKey) => {
  const signature = await connection.requestAirdrop(
    toPublicKey(address),
    toLamports(10)
  );
  await connection.confirmTransaction(signature);
};

describe("SPL", () => {
  let refinable: RefinableSolanaClient;
  const API_KEY_SOLANA_SELLER = process.env.API_KEY_SOLANA_SELLER as string;
  const keypair = Keypair.fromSecretKey(new Uint8Array(userPrivateKey));
  const buyerKeypair = Keypair.fromSecretKey(new Uint8Array(buyerPrivateKey));

  console.log(`Starting tests using user ${keypair.publicKey.toBase58()}`);

  const wallet = new Wallet(keypair);
  const randomWallet = new Wallet(buyerKeypair);

  beforeAll(async () => {
    refinable = await RefinableSolanaClient.create(
      wallet,
      API_KEY_SOLANA_SELLER,
      {
        commitment: "confirmed",
        environment: Environment.Local,
      }
    );

    await airdrop(refinable.connection, keypair.publicKey);
    await airdrop(refinable.connection, randomWallet.publicKey);
  });

  it("should get the current instance", async () => {
    const apiKey = refinable.apiKey;
    expect(apiKey).toBeDefined();
    expect(refinable.accountAddress).toBe(keypair.publicKey.toBase58());
  });

  let nftMintToken: PublicKey;
  let sellerTokenAccount: PublicKey;

  it("Should be able to mint nft", async () => {
    ({ sellerTokenAccount, nftMintToken } = await mintNFT(refinable, wallet));

    const largestTokenAccounts =
      await refinable.connection.getTokenLargestAccounts(nftMintToken);

    expect(largestTokenAccounts.value[0].address.toBase58()).toBe(
      sellerTokenAccount.toBase58()
    );
  });

  let offer: SaleOffer;
  let nft: SPLNFT;

  it("Should be able to put nft on sale", async () => {
    nft = refinable.createNft({
      chainId: Chain.SolanaLocalnet,
      contractAddress: TOKEN_PROGRAM_ID.toBase58(),
      tokenId: nftMintToken.toBase58(),
      supply: 1,
    });

    offer = await nft.putForSale({
      currency: PriceCurrency.Sol,
      amount: 2,
    });

    expect(
      (
        await refinable.connection.getParsedAccountInfo(
          toPublicKey(offer.blockchainId)
        )
      ).value
    ).not.toBeNull();
  });

  it("Should be able to cancel nft sale", async () => {
    expect(
      (
        await refinable.connection.getParsedAccountInfo(
          toPublicKey(offer.blockchainId)
        )
      ).value
    ).not.toBeNull();

    const tx = await offer.cancelSale<SolanaTransaction>();

    await tx.wait("finalized");

    expect(
      (
        await refinable.connection.getParsedAccountInfo(
          toPublicKey(offer.blockchainId)
        )
      ).value
    ).toBeNull();
  });

  it("Should be able to buy nft", async () => {
    // Backend might not have processed the event
    await sleep(2000);

    offer = await nft.putForSale({
      price: {
        currency: PriceCurrency.Sol,
        amount: 2,
      },
    });

    expect(
      (
        await refinable.connection.getParsedAccountInfo(
          toPublicKey(offer.blockchainId)
        )
      ).value
    ).not.toBeNull();

    const refinableBuyer = await RefinableSolanaClient.create(
      randomWallet,
      process.env.API_KEY_SOLANA_BUYER,
      {
        commitment: "confirmed",
        environment: Environment.Local,
      }
    );

    const nftBuyer = refinableBuyer.createNft({
      chainId: Chain.SolanaLocalnet,
      contractAddress: TOKEN_PROGRAM_ID.toBase58(),
      tokenId: nftMintToken.toBase58(),
      supply: 1,
    });

    const buyerOffer: SaleOffer = refinableBuyer.createOffer(
      {
        type: OfferType.Sale,
        id: offer.id,
        price: offer.price,
        blockchainId: offer.blockchainId,
        totalSupply: offer.totalSupply,
        user: offer.user,
      },
      nftBuyer as any
    );

    const tx = await buyerOffer.buy({ amount: 1 });

    await tx.wait();

    expect(
      (
        await refinable.connection.getParsedAccountInfo(
          toPublicKey(offer.blockchainId)
        )
      ).value
    ).toBeNull();

    const tokenAccounts = await refinable.connection.getTokenLargestAccounts(
      nftMintToken
    );
    const buyerTokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      nftMintToken,
      buyerKeypair.publicKey
    );

    expect(
      tokenAccounts.value.filter((a) => a.uiAmount !== 0)[0].address.toBase58()
    ).toEqual(buyerTokenAccount.toBase58());
  });
});
