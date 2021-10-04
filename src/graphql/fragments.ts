import { gql } from "graphql-request";

export const ITEM_CARD_INFO_FRAMGENT = gql`
  fragment ItemCardInfo on Item {
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
`;

export const CARD_SALE_INFO = gql`
  fragment CardSaleInfo on Offer {
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
`;

export const GALLERY_ITEM_WITH_OFFER = gql`
  fragment GalleryItemWithOffer on ItemWithOffer {
    id
    item {
      ...ItemCardInfo
    }
    nextEditionForSale {
      ...CardSaleInfo
    }
  }
  ${ITEM_CARD_INFO_FRAMGENT}
  ${CARD_SALE_INFO}
`;
