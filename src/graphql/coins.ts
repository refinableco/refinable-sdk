import { gql } from "graphql-request";

export const GET_COIN = gql`
  query getCoin($input: GetCoinInput!, $chainId: Int!) {
    coin(input: $input) {
      id
      ticker
      priceInUSD
      name
      contract(chainId: $chainId) {
        address
        decimals
        isNative
      }
    }
  }
`;
