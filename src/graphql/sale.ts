import { gql } from "graphql-request";
import { OfferFragment } from "./fragments";

export const CREATE_OFFER = gql`
  mutation createOfferForEditions($input: CreateOfferInput!, $storeId: ID) {
    createOfferForItems(input: $input) {
      ...Offer
    }
  }
  ${OfferFragment}
`;

export const CREATE_MINT_OFFER = gql`
  mutation createMintOffer($input: CreateMintOfferInput!, $storeId: ID) {
    createMintOffer(input: $input) {
      ...Offer
      contract {
        contractAddress
        chainId
      }
    }
  }
  ${OfferFragment}
`;

export const PURCHASE_ITEM = gql`
  mutation purchaseItem($input: CreatePurchaseInput!) {
    createPurchase(input: $input) {
      transactionHash
    }
  }
`;
