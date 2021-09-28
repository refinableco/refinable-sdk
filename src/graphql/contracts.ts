import { gql } from "graphql-request";

export const GET_REFINABLE_CONTRACT = gql`
  query refinableContracts($input: GetRefinableContractsInput!) {
    refinableContracts(input: $input) {
      contractAddress
      contractABI
      type
    }
  }
`;
