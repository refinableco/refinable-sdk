import { AbstractEvmNFT, ERC1155NFT, SPLNFT } from "..";
import { OfferType, TokenType } from "../@types/graphql";
import { AuctionOffer } from "../offer/AuctionOffer";
import { Offer } from "../offer/Offer";
import { SaleOffer } from "../offer/SaleOffer";

export const isAuctionOffer = (offer: Offer): offer is AuctionOffer =>
  offer.type === OfferType.Auction;
export const isSaleOffer = (offer: Offer): offer is SaleOffer =>
  offer.type === OfferType.Sale;

export const isERC1155Item = (item: { type: TokenType }): item is ERC1155NFT =>
  item.type === TokenType.Erc1155;
export const isEVMNFT = (item: { type: TokenType }): item is AbstractEvmNFT =>
  [TokenType.Erc721, TokenType.Erc1155].includes(item.type);
