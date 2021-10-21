import { gql } from "graphql-request";
import { OfferFragment } from "./fragments";

export const CREATE_OFFER = gql`
  mutation createOfferForEditions($input: CreateOffersInput!) {
    createOfferForItems(input: $input) {
      ...OfferInfo
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
