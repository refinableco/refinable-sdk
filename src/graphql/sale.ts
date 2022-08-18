import { gql } from "graphql-request";
import { MintOfferFragment, OfferFragment } from "./fragments";

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
      ...MintOffer
    }
  }
  ${OfferFragment}
  ${MintOfferFragment}
`;
export const UPDATE_MINT_OFFER = gql`
  mutation updateMintOffer(
    $id: ID!
    $input: UpdateMintOfferInput!
    $storeId: ID
  ) {
    updateMintOffer(id: $id, input: $input) {
      ...Offer
      ...MintOffer
    }
  }
  ${OfferFragment}
  ${MintOfferFragment}
`;

export const PURCHASE_ITEM = gql`
  mutation purchaseItem($input: CreatePurchaseInput!) {
    createPurchase(input: $input) {
      transactionHash
    }
  }
`;
