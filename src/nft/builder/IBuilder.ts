import { CreateItemInput, IRoyalty } from "../..";
import { AbstractNFT } from "../AbstractNFT";
import { ERC1155NFT } from "../ERC1155NFT";
import { ERC721NFT } from "../ERC721NFT";
import { Stream } from "form-data";

export interface NftBuilderParams
  extends Omit<
    CreateItemInput,
    "royaltySettings" | "contractAddress" | "file"
  > {
  royalty?: IRoyalty;
  contractAddress?: string;
  file?: string;
  nftFile?: Stream;
}

export interface NftBuilderParamsWithFileStream
  extends Omit<NftBuilderParams, "file"> {
  nftFile: Stream;
}

export interface IBuilder<NFTClass extends AbstractNFT = AbstractNFT> {
  erc721(
    params: Omit<NftBuilderParamsWithFileStream, "type" | "supply">
  ): IBuilder<ERC721NFT>;

  erc1155(
    params: Omit<NftBuilderParamsWithFileStream, "type">
  ): IBuilder<ERC1155NFT>;

  /**
   * Creates an item in the DB and retrieves a tokenId and signature
   */
  create();

  /**
   * Mints an item on-chain
   */
  mint();

  /**
   * Action to finalize minting and return a item object
   */
  finishMint(): Promise<AbstractNFT>;

  /**
   * Aggregated procedure to create item in the DB, mint and finish mint
   */
  createAndMint(): Promise<NFTClass>;
}
