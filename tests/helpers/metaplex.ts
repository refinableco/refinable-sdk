import {
  CreateMasterEdition,
  CreateMetadata,
  Creator,
  MasterEdition,
  Metadata,
  MetadataDataData,
  SignMetadata,
  UpdateMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { actions } from "@metaplex/js";
import { BN, Wallet } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { RefinableSolanaClient } from "../../src";

// In a lot of cases uri will be set in a separate tx
export function getMetadata(creator: PublicKey, uri: string = " ".repeat(64)) {
  return new MetadataDataData({
    name: "test-nft",
    symbol: "TEST",
    uri,
    sellerFeeBasisPoints: 10,
    creators: [
      new Creator({
        address: creator.toBase58(),
        share: 100,
        verified: true,
      }),
    ],
  });
}

export async function mintNFT(
  refinable: RefinableSolanaClient,
  wallet: Wallet
) {
  // Create the mint.
  const { mint, createMintTx, createAssociatedTokenAccountTx, mintToTx } =
    await actions.prepareTokenAccountAndMintTxs(
      refinable.connection,
      wallet.publicKey
    );

  const metadataPDA = await Metadata.getPDA(mint.publicKey);
  const editionPDA = await MasterEdition.getPDA(mint.publicKey);

  // Create the metadata.
  const createMetadataTx = new CreateMetadata(
    { feePayer: wallet.publicKey },
    {
      metadata: metadataPDA,
      metadataData: getMetadata(wallet.publicKey),
      updateAuthority: wallet.publicKey,
      mint: mint.publicKey,
      mintAuthority: wallet.publicKey,
    }
  );

  const masterEditionTx = new CreateMasterEdition(
    { feePayer: wallet.publicKey },
    {
      edition: editionPDA,
      metadata: metadataPDA,
      updateAuthority: wallet.publicKey,
      mint: mint.publicKey,
      mintAuthority: wallet.publicKey,
      maxSupply: new BN(1),
    }
  );

  const txId = await actions.sendTransaction({
    connection: refinable.connection,
    signers: [mint],
    txs: [
      createMintTx,
      createMetadataTx,
      createAssociatedTokenAccountTx,
      mintToTx,
      masterEditionTx,
    ],
    wallet,
  });

  await refinable.connection.confirmTransaction(txId, "max");

  // Update metadata
  const updateTx = new UpdateMetadata(
    { feePayer: wallet.publicKey },
    {
      metadata: metadataPDA,
      updateAuthority: wallet.publicKey,
      metadataData: getMetadata(
        wallet.publicKey,
        "https://bafkreibj4hjlhf3ehpugvfy6bzhhu2c7frvyhrykjqmoocsvdw24omfqga.ipfs.dweb.link"
      ),
    }
  );

  const signTx = new SignMetadata(
    { feePayer: wallet.publicKey },
    {
      metadata: metadataPDA,
      creator: wallet.publicKey,
    }
  );

  const txId2 = await actions.sendTransaction({
    connection: refinable.connection,
    signers: [],
    txs: [updateTx, signTx],
    wallet,
  });

  await refinable.connection.confirmTransaction(txId2, "max");

  return {
    sellerTokenAccount: await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      wallet.publicKey
    ),
    metadata: metadataPDA,
    nftMintToken: mint.publicKey,
  };
}
