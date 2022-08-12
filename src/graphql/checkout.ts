import { gql } from "graphql-request";

export const CREATE_PURCHASE_SESSION = gql`
  mutation createPurchaseSession($input: CreatePurchaseSessionInput!) {
    createPurchaseSession(input: $input) {
      id
      url
    }
  }
`;
