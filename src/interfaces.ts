import { GraphQLClient } from "graphql-request";
import { TokenType } from "./@types/graphql";
import Account from "./Account";
import { AbstractNFT } from "./nft/AbstractNFT";
import { ERC1155NFT } from "./nft/ERC1155NFT";
import { ERC721NFT } from "./nft/ERC721NFT";
import { RefinableContracts } from "./RefinableContracts";
import { SafetyDepositDraft } from "./solana/actions/createAuctionManager";
import { WinningConfigType } from "./solana/oyster";

export const nftMap = {
    [TokenType.Erc721]: ERC721NFT,
    [TokenType.Erc1155]: ERC1155NFT,
  };

export type NftMap = typeof nftMap;

type Tuples<T, F> = T extends TokenType ? [T, InstanceType<NftMap[T]>] : F;
export type SingleKeys<K> = [K] extends (K extends TokenType ? [K] : string)
  ? K
  : string;

export type ClassType<A extends TokenType, F extends AbstractNFT> =
  | Extract<Tuples<TokenType, F>, [A, any]>[1]
  | F;

export enum AuctionCategory {
    InstantSale,
    Limited,
    Single,
    Open,
    Tiered,
}

interface TierDummyEntry {
    safetyDepositBoxIndex: number;
    amount: number;
    winningConfigType: WinningConfigType;
  }
interface Tier {
    items: (TierDummyEntry | {})[];
    winningSpots: number[];
}
export interface AuctionState {
    // Min price required for the item to sell
    reservationPrice: number;
  
    // listed NFTs
    // items: SafetyDepositDraft[];
    items: any;
    participationNFT?: SafetyDepositDraft;
    participationFixedPrice?: number;
    // number of editions for this auction (only applicable to limited edition)
    editions?: number;
  
    // date time when auction should start UTC+0
    startDate?: Date;
  
    // suggested date time when auction should end UTC+0
    endDate?: Date;
  
    //////////////////
    category: AuctionCategory;
  
    price?: number;
    priceFloor?: number;
    priceTick?: number;
  
    startSaleTS?: number;
    startListTS?: number;
    endTS?: number;
  
    auctionDuration?: number;
    auctionDurationType?: 'days' | 'hours' | 'minutes';
    gapTime?: number;
    gapTimeType?: 'days' | 'hours' | 'minutes';
    tickSizeEndingPhase?: number;
  
    spots?: number;
    tiers?: Array<Tier>;
  
    winnersCount: number;
  
    instantSalePrice?: number;
  }