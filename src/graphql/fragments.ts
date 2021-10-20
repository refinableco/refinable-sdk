import { gql } from "graphql-request";

const saleInfoFragment = gql`
  fragment itemSaleInfo on Offer {
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

const itemInfoFragment = gql`
  fragment itemInfo on Item {
    id
    tokenId
    contractAddress
    supply
    totalSupply
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

export const ItemWithOfferFragment = gql`
  fragment getItemsWithOffer on ItemWithOffer {
    id
    item {
      ...itemInfo
    }
    nextEditionForSale {
      ...itemSaleInfo
    }
  }
  ${itemInfoFragment}
  ${saleInfoFragment}
`;

export const UserItemsFragment = gql`
  fragment userItems on Item {
    ...itemInfo
    userSupply(ethAddress: $ethAddress)
    nextEditionForSale(ethAddress: $ethAddress) {
      ...itemSaleInfo
    }
  }
  ${itemInfoFragment}
  ${saleInfoFragment}
`;

export const AuctionFragment = gql`
  fragment AuctionInfo on Auction {
    id
    auctionId
    auctionContractAddress
    bids {
      transactionHash
      bidAmount
      bidTime
      bidder {
        ethAddress
        description
        name
        profileImage
      }
    }
    highestBid {
      transactionHash
      bidAmount
      bidTime
      bidder {
        ethAddress
        description
        name
        profileImage
      }
    }
    startTime
    endTime
    startPrice
  }
`;
export const OfferFragment = gql`
  fragment OfferInfo on Offer {
    id
    type
    active
    supply
    totalSupply
    user {
      id
      ethAddress
    }
    price {
      amount
      currency
    }
    signature
    auction {
      ...AuctionInfo
    }
  }
  ${AuctionFragment}
`;
