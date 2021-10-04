import { gql } from "graphql-request";

export const ItemWithOfferFragment = gql`
  fragment getItemsWithOffer on ItemWithOffer {
    id
    item {
      id
      tokenId
      contractAddress
      supply
      name
      description
      chainId
      creator {
        id
        ethAddress
        name
        profileImage
        verified
      }
      collection {
        slug
        name
        iconUrl
        verified
      }
      properties {
        fileType
        imagePreview
        fileUrl
        originalFileUrl
        thumbnailUrl
        originalThumbnailUrl
      }
      transcodings {
        url
        mimeType
      }
    }
    nextEditionForSale {
      id
      createdAt
      type
      supply
      price {
        amount
        currency
      }
      auction {
        id
        highestBid {
          transactionHash
          bidAmount
        }
        startPrice
        startTime
        endTime
      }
    }
  }
`;
