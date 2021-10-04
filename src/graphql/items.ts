import { gql } from "graphql-request";
import { GALLERY_ITEM_WITH_OFFER } from "./fragments";

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
            ...GalleryItemWithOffer
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

  ${GALLERY_ITEM_WITH_OFFER}
`;
