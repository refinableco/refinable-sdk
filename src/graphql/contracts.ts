import { gql } from "graphql-request";

export const GET_REFINABLE_CONTRACT = gql`
  query refinableContracts($input: GetRefinableContractsInput!) {
    refinableContracts(input: $input) {
      contractAddress
      contractABI
      type
      tags
    }
  }
`;

export const GET_MINTABLE_COLLECTIONS_QUERY = gql`
  query getMintableCollections {
    mintableCollections {
      default
      tokens {
        contractAddress
        contractABI
        type
        chainId
        tags
      }
    }
  }
`;
