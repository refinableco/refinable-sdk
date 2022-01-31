import { TokenType } from "./@types/graphql";
import { AbstractNFT } from "./nft/AbstractNFT";
import { ERC1155NFT } from "./nft/ERC1155NFT";
import { ERC721NFT } from "./nft/ERC721NFT";

export const nftMap = {
  [TokenType.Erc721]: ERC721NFT,
  [TokenType.Erc1155]: ERC1155NFT,
};

export type NftMap = typeof nftMap;
export type NftMapTypes = keyof typeof nftMap;

type Tuples<T, F> = T extends NftMapTypes ? [T, InstanceType<NftMap[T]>] : F;
export type SingleKeys<K> = [K] extends (K extends NftMapTypes ? [K] : string)
  ? K
  : string;

export type ClassType<A extends NftMapTypes, F extends AbstractNFT> =
  | Extract<Tuples<TokenType, F>, [A, any]>[1]
  | F;
