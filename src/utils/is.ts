import { ethers } from "ethers";
import { AbstractEvmNFT, ERC1155NFT } from "..";
import { OfferType, TokenType } from "../@types/graphql";
import { AuctionOffer } from "../offer/AuctionOffer";
import { MintOffer } from "../offer/MintOffer";
import { BasicOffer } from "../offer/Offer";
import { SaleOffer } from "../offer/SaleOffer";

export const isAuctionOffer = (offer: BasicOffer): offer is AuctionOffer =>
  offer.type === OfferType.Auction;
export const isSaleOffer = (offer: BasicOffer): offer is SaleOffer =>
  offer.type === OfferType.Sale;
export const isMintOffer = (offer: BasicOffer): offer is MintOffer =>
  offer.type === OfferType.Mint;

export const isERC1155Item = (item: { type: TokenType }): item is ERC1155NFT =>
  item.type === TokenType.Erc1155;
export const isEVMNFT = (item: { type: TokenType }): item is AbstractEvmNFT =>
  [TokenType.Erc721, TokenType.Erc1155].includes(item.type);

export const isNative = (payTokenAddress: string) => {
  return payTokenAddress.toLowerCase() === ethers.constants.AddressZero;
};
