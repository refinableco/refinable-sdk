import { gql } from "graphql-request";

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

export const CREATE_OFFER = gql`
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
