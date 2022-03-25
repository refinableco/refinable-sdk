import { gql } from "graphql-request";

export const GET_REFINABLE_CONTRACT = gql`
  query refinableContract($input: GetRefinableContractInput!) {
    refinableContract(input: $input) {
      contractAddress
      contractABI
      type
      tags
      chainId
    }
  }
`;
export const GET_REFINABLE_CONTRACTS = gql`
  query refinableContracts($input: GetRefinableContractsInput!) {
    refinableContracts(input: $input) {
      contractAddress
      contractABI
      type
      tags
      chainId
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

export const CREATE_CONTRACT = gql`
  mutation createContract($data: CreateContractInput!) {
    createContract(data: $data) {
      contractAddress
      contractABI
      type
      tags
      chainId
    }
  }
`;
