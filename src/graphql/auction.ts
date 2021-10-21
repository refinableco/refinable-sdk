import { gql } from "graphql-request";

export const PLACE_AUCTION_BID = gql`
  mutation placeAuctionBid($input: AuctionPlaceBidInput!) {
    placeAuctionBid(input: $input)
  }
`;