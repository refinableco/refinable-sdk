import { gql } from "graphql-request";

const saleInfoFragment = gql`
  fragment itemSaleInfo on Offer {
    id
    createdAt
    chainId
    type
    supply
    price {
      amount
      currency {
        id
        ticker
      }
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
  fragment Auction on Auction {
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
  fragment Offer on Offer {
    id
    type
    active
    supply
    chainId
    totalSupply
    startTime
    endTime
    contractAddress
    user {
      id
      ethAddress
    }
    price {
      amount
      decimals
      address
      priceInUSD
      currency {
        id
        ticker
        coingeckoId
        name
      }
    }
    signature
    blockchainId
    auction {
      ...Auction
    }
    orderParams
    platform
    whitelistStage
    launchpadDetails {
      currentStage {
        startTime
        stage
        price
        isWhitelisted
      }
    }
    marketConfig(storeId: $storeId) {
      data
      signature
      buyServiceFeeBps {
        type
        value
      }
    }
    whitelistVoucher {
      limit
      signature
      startTime
      price
    }
  }
  ${AuctionFragment}
`;

export const MintOfferFragment = gql`
  fragment MintOffer on MintOffer {
    name
    description
    chainId
    payee
    previewFile {
      fileUrl
      imagePreview
    }
  }
`;
