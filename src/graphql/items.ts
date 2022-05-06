import { addTypenameToDocument } from "@apollo/client/utilities";
import { parse } from "graphql";
import { gql } from "graphql-request";
import {
  ItemWithOfferFragment,
  MintOfferFragment,
  OfferFragment,
  UserItemsFragment,
} from "./fragments";

export const GET_USER_OFFER_ITEMS = gql`
  query getUserOfferItems(
    $ethAddress: String!
    $filter: UserItemOnOfferFilterInput
    $paging: PagingInput!
    $sort: SortInput
  ) {
    user(ethAddress: $ethAddress) {
      id
      itemsOnOffer(filter: $filter, paging: $paging, sort: $sort) {
        edges {
          cursor
          node {
            ...getItemsWithOffer
          }
        }
        pageInfo {
          startCursor
          endCursor
          hasNextPage
          hasPreviousPage
        }
        totalCount
      }
    }
  }

  ${ItemWithOfferFragment}
`;

export const GET_OFFER = addTypenameToDocument(
  parse(`
  query getOffer($id: ID!, $storeId: ID) {
    offer(id: $id) {
      ...Offer
      item {
        id
        type
        tokenId
        contractAddress
        supply
        totalSupply
        chainId
      }
      ... on MintOffer {
        ...MintOffer
      }
    }
  }

  ${OfferFragment}
  ${MintOfferFragment}
`)
);

export const GET_USER_ITEMS = gql`
  query getUserItems(
    $ethAddress: String!
    $filter: UserItemFilterInput!
    $paging: PagingInput!
  ) {
    user(ethAddress: $ethAddress) {
      id
      items(filter: $filter, paging: $paging) {
        edges {
          cursor
          node {
            ...userItems
          }
        }
        pageInfo {
          startCursor
          endCursor
          hasNextPage
          hasPreviousPage
        }
        totalCount
      }
    }
  }
  ${UserItemsFragment}
`;

export const REFRESH_METADATA = gql`
  mutation refreshMetadata($input: RefreshMetadataInput!) {
    refreshMetadata(input: $input)
  }
`;
