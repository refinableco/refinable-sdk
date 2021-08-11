import { gql } from "@urql/core";

export enum TOKEN_TYPE {
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
}

export interface Royalties {
  value: number;
  recipient: string;
}

export interface Signature {
  v: number;
  r: string;
  s: string;
}

export const CREATE_OFFERS = gql`
  mutation createOfferForEditions($input: CreateOffersInput!) {
    createOfferForItems(input: $input) {
      id
      active
      supply
      price {
        amount
        currency
      }
      signature
      auction {
        id
        auctionId
        bids {
          transactionHash
          bidAmount
          bidTime
          bidder {
            ethAddress
            description
            name
            profileImage
          }
        }
        highestBid {
          transactionHash
          bidAmount
          bidTime
          bidder {
            ethAddress
            description
            name
            profileImage
          }
        }
        startTime
        endTime
        startPrice
      }
    }
  }
`;
