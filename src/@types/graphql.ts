/* eslint-disable */
// THIS IS A GENERATED FILE, DO NOT EDIT IT!
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

export enum AssetType {
  Collection = "COLLECTION",
  Item = "ITEM",
  Tag = "TAG",
  User = "USER",
}

export type Auction = {
  __typename?: "Auction";
  auctionContractAddress?: Maybe<Scalars["String"]>;
  auctionId?: Maybe<Scalars["String"]>;
  bids: Array<Bid>;
  endTime?: Maybe<Scalars["DateTime"]>;
  highestBid?: Maybe<Bid>;
  id: Scalars["String"];
  owner: User;
  startPrice?: Maybe<Scalars["Float"]>;
  startTime?: Maybe<Scalars["DateTime"]>;
  tokenId?: Maybe<Scalars["String"]>;
  transaction?: Maybe<Transaction>;
  transactionHash?: Maybe<Scalars["String"]>;
  verified?: Maybe<Scalars["Boolean"]>;
  verifiedAt?: Maybe<Scalars["DateTime"]>;
};

export type AuctionPlaceBidInput = {
  auctionId: Scalars["String"];
  bidAmount: Scalars["Float"];
  transactionHash: Scalars["String"];
};

export enum AuctionType {
  Closed = "CLOSED",
  ClosingSoon = "CLOSING_SOON",
  OnGoing = "ON_GOING",
  OpenTopBids = "OPEN_TOP_BIDS",
  Upcoming = "UPCOMING",
}

export type Auth = {
  __typename?: "Auth";
  /** JWT Bearer token */
  token: Scalars["String"];
  user: AuthUser;
};

export type AuthUser = {
  __typename?: "AuthUser";
  description?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["String"]>;
  ethAddress?: Maybe<Scalars["String"]>;
  fineHolderBenefits?: Maybe<FineHolderBenefits>;
  id: Scalars["String"];
  instagram?: Maybe<Scalars["String"]>;
  items: ItemsResponse;
  itemsLiked: ItemsResponse;
  itemsOnOffer: ItemsWithOffersResponse;
  name?: Maybe<Scalars["String"]>;
  profileBanner?: Maybe<Scalars["String"]>;
  profileImage?: Maybe<Scalars["String"]>;
  receivedComRewards: Scalars["Float"];
  roles?: Maybe<Array<UserRoles>>;
  twitter?: Maybe<Scalars["String"]>;
  verified?: Maybe<Scalars["Boolean"]>;
  website?: Maybe<Scalars["String"]>;
};

export type AuthUserItemsArgs = {
  filter: UserItemFilterInput;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type AuthUserItemsLikedArgs = {
  paging: PagingInput;
};

export type AuthUserItemsOnOfferArgs = {
  filter?: InputMaybe<UserItemOnOfferFilterInput>;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type Bid = {
  __typename?: "Bid";
  bidAmount: Scalars["Float"];
  bidTime: Scalars["DateTime"];
  bidder?: Maybe<User>;
  transactionHash: Scalars["String"];
  verified?: Maybe<Scalars["Boolean"]>;
  verifiedAt?: Maybe<Scalars["DateTime"]>;
};

export type Brand = {
  __typename?: "Brand";
  description: Scalars["String"];
  fileUrl: Scalars["String"];
  id: Scalars["String"];
  link: Scalars["String"];
  name: Scalars["String"];
};

export type CheckCollectionsInput = {
  collectionIds: Array<Scalars["String"]>;
};

export type Collection = {
  __typename?: "Collection";
  bannerUrl?: Maybe<Scalars["String"]>;
  chainId: Scalars["Float"];
  collectionIds: Array<Scalars["String"]>;
  default: Scalars["Boolean"];
  description?: Maybe<Scalars["String"]>;
  discord?: Maybe<Scalars["String"]>;
  iconUrl: Scalars["String"];
  id: Scalars["String"];
  instagram?: Maybe<Scalars["String"]>;
  items: ItemsWithOffersResponse;
  name: Scalars["String"];
  slug: Scalars["String"];
  statistics: CollectionStatistics;
  telegram?: Maybe<Scalars["String"]>;
  tokens?: Maybe<Array<Token>>;
  twitter?: Maybe<Scalars["String"]>;
  verified: Scalars["Boolean"];
  website?: Maybe<Scalars["String"]>;
};

export type CollectionItemsArgs = {
  filter?: InputMaybe<CollectionMetadataFilterInput>;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type CollectionEdge = {
  __typename?: "CollectionEdge";
  cursor: Scalars["String"];
  node: Collection;
};

export type CollectionInput = {
  avatar: Scalars["String"];
  description: Scalars["String"];
  slug: Scalars["String"];
  symbol: Scalars["String"];
  title: Scalars["String"];
  tokenType: Scalars["String"];
};

export type CollectionMetadataFilterInput = {
  auctionType?: InputMaybe<AuctionType>;
  chainIds?: InputMaybe<Array<Scalars["String"]>>;
  collectionIds?: InputMaybe<Array<Scalars["String"]>>;
  collectionSlugs?: InputMaybe<Array<Scalars["String"]>>;
  contentType?: InputMaybe<ContentType>;
  currencies?: InputMaybe<Array<PriceCurrency>>;
  metadata: Scalars["JSON"];
  offerTypes?: InputMaybe<Array<OfferType>>;
  tagName?: InputMaybe<Scalars["String"]>;
  titleQuery?: InputMaybe<Scalars["String"]>;
};

export type CollectionMetadataValues = {
  __typename?: "CollectionMetadataValues";
  displayType?: Maybe<Scalars["String"]>;
  max: Scalars["String"];
  min: Scalars["String"];
  possibilities: Array<MetadataValuePossibility>;
  traitType: Scalars["String"];
  type: Scalars["String"];
};

export type CollectionMetadataValuesInput = {
  collectionIds: Array<Scalars["String"]>;
};

export type CollectionPageInfo = {
  __typename?: "CollectionPageInfo";
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type CollectionStatistics = {
  __typename?: "CollectionStatistics";
  countPurchases: Scalars["Float"];
  floorPrice: Scalars["Float"];
  itemCount: Scalars["Float"];
  itemViewsCount: Scalars["Float"];
  mainToken: Scalars["String"];
  ownerCount: Scalars["Float"];
  totalEditionsForSale: Scalars["Float"];
  totalVolumeTraded: Scalars["Float"];
};

export type CollectionsFilterInput = {
  chainIds?: InputMaybe<Array<Scalars["Float"]>>;
};

export type CollectionsResponse = {
  __typename?: "CollectionsResponse";
  edges?: Maybe<Array<CollectionEdge>>;
  pageInfo?: Maybe<CollectionPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export enum ContentType {
  CommunityContent = "COMMUNITY_CONTENT",
  VerifiedContent = "VERIFIED_CONTENT",
}

export type Contract = {
  __typename?: "Contract";
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
  contractId?: Maybe<Scalars["String"]>;
};

export type ContractCount = {
  __typename?: "ContractCount";
  minted: Scalars["Int"];
  transfered: Scalars["Int"];
};

export type ContractInput = {
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
};

export type ContractOutput = {
  __typename?: "ContractOutput";
  chainId: Scalars["Int"];
  contractABI: Scalars["String"];
  contractAddress: Scalars["String"];
  tags: Array<ContractTag>;
  type: Scalars["String"];
};

export enum ContractTag {
  AirdropV1_0_0 = "AIRDROP_v1_0_0",
  AuctionV1_0_0 = "AUCTION_v1_0_0",
  AuctionV2_0_0 = "AUCTION_v2_0_0",
  AuctionV3_0_0 = "AUCTION_v3_0_0",
  AuctionV3_1_0 = "AUCTION_v3_1_0",
  AuctionV3_1_1 = "AUCTION_v3_1_1",
  AuctionV4_0_0 = "AUCTION_v4_0_0",
  AuctionV5_0_0 = "AUCTION_v5_0_0",
  LazyMintTokenV1_0_0 = "LAZY_MINT_TOKEN_v1_0_0",
  SaleNonceHolderV1_0_0 = "SALE_NONCE_HOLDER_v1_0_0",
  SaleV1_0_0 = "SALE_v1_0_0",
  SaleV2_0_0 = "SALE_v2_0_0",
  SaleV3_0_0 = "SALE_v3_0_0",
  SaleV3_0_1 = "SALE_v3_0_1",
  SaleV3_1_0 = "SALE_v3_1_0",
  SaleV3_2_0 = "SALE_v3_2_0",
  SaleV4_0_0 = "SALE_v4_0_0",
  SaleV4_1_0 = "SALE_v4_1_0",
  ServiceFeeProxyV1_0_0 = "SERVICE_FEE_PROXY_v1_0_0",
  ServiceFeeV1_0_0 = "SERVICE_FEE_v1_0_0",
  TokenV1_0_0 = "TOKEN_v1_0_0",
  TokenV2_0_0 = "TOKEN_v2_0_0",
  TokenV3_0_0 = "TOKEN_v3_0_0",
  TransferProxyV1_0_0 = "TRANSFER_PROXY_v1_0_0",
}

export enum ContractTypes {
  Auction = "AUCTION",
  Erc20Token = "ERC20_TOKEN",
  Erc721Airdrop = "ERC721_AIRDROP",
  Erc721Auction = "ERC721_AUCTION",
  Erc721LazyMintToken = "ERC721_LAZY_MINT_TOKEN",
  Erc721Sale = "ERC721_SALE",
  Erc721SaleNonceHolder = "ERC721_SALE_NONCE_HOLDER",
  Erc721Token = "ERC721_TOKEN",
  Erc721WhitelistedToken = "ERC721_WHITELISTED_TOKEN",
  Erc1155Airdrop = "ERC1155_AIRDROP",
  Erc1155Auction = "ERC1155_AUCTION",
  Erc1155Sale = "ERC1155_SALE",
  Erc1155SaleNonceHolder = "ERC1155_SALE_NONCE_HOLDER",
  Erc1155Token = "ERC1155_TOKEN",
  Erc1155WhitelistedToken = "ERC1155_WHITELISTED_TOKEN",
  Sale = "SALE",
  ServiceFeeProxy = "SERVICE_FEE_PROXY",
  ServiceFeeV2 = "SERVICE_FEE_V2",
  TransferProxy = "TRANSFER_PROXY",
}

export type CreateContractInput = {
  collection: CollectionInput;
  contract: RefinableContractInput;
};

export type CreateEventInput = {
  events: Array<EventInput>;
};

export type CreateItemInput = {
  airdropAddresses?: InputMaybe<Array<Scalars["String"]>>;
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
  description?: InputMaybe<Scalars["String"]>;
  file: Scalars["String"];
  marketingDescription?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  royaltySettings?: InputMaybe<RoyaltySettingsInput>;
  supply: Scalars["Float"];
  tags?: InputMaybe<Array<TagInput>>;
  thumbnail?: InputMaybe<Scalars["String"]>;
  type: Scalars["String"];
};

export type CreateItemOutput = {
  __typename?: "CreateItemOutput";
  item: Item;
  signature?: Maybe<Scalars["String"]>;
};

export type CreateMintOfferInput = {
  blockchainId?: InputMaybe<Scalars["String"]>;
  chainId: Scalars["Int"];
  contractAddress: Scalars["String"];
  description?: InputMaybe<Scalars["String"]>;
  endTime?: InputMaybe<Scalars["DateTime"]>;
  launchpadDetails?: InputMaybe<LaunchpadDetailsInput>;
  name?: InputMaybe<Scalars["String"]>;
  offerContractAddress?: InputMaybe<Scalars["String"]>;
  previewImage: Scalars["String"];
  price?: InputMaybe<PriceInput>;
  signature?: InputMaybe<Scalars["String"]>;
  startTime?: InputMaybe<Scalars["DateTime"]>;
  supply: Scalars["Float"];
  transactionHash?: InputMaybe<Scalars["String"]>;
  type: Scalars["String"];
};

export type CreateOfferInput = {
  blockchainId?: InputMaybe<Scalars["String"]>;
  contractAddress: Scalars["String"];
  endTime?: InputMaybe<Scalars["DateTime"]>;
  launchpadDetails?: InputMaybe<LaunchpadDetailsInput>;
  offerContractAddress?: InputMaybe<Scalars["String"]>;
  price?: InputMaybe<PriceInput>;
  signature?: InputMaybe<Scalars["String"]>;
  startTime?: InputMaybe<Scalars["DateTime"]>;
  supply: Scalars["Float"];
  tokenId: Scalars["String"];
  transactionHash?: InputMaybe<Scalars["String"]>;
  type: Scalars["String"];
};

export type CreatePurchaseInput = {
  amount: Scalars["Int"];
  metadata?: InputMaybe<PurchaseMetadata>;
  offerId: Scalars["String"];
  transactionHash: Scalars["String"];
};

export type CreatePurchaseSessionFilterInput = {
  chainId?: InputMaybe<Scalars["Int"]>;
  contractAddress?: InputMaybe<Scalars["String"]>;
  offerId?: InputMaybe<Scalars["String"]>;
  tokenId?: InputMaybe<Scalars["String"]>;
  userEthAddress?: InputMaybe<Scalars["String"]>;
};

export type CreatePurchaseSessionInput = {
  cancelUrl?: InputMaybe<Scalars["String"]>;
  filter: CreatePurchaseSessionFilterInput;
  successUrl?: InputMaybe<Scalars["String"]>;
};

export type CreateStoreInput = {
  backgroundColor: Scalars["String"];
  banner: Scalars["String"];
  contracts: Array<ContractInput>;
  customLinks?: InputMaybe<Array<CustomLinkInput>>;
  description: Scalars["String"];
  discord?: InputMaybe<Scalars["String"]>;
  domain: Scalars["String"];
  email: Scalars["String"];
  favicon: Scalars["String"];
  instagram?: InputMaybe<Scalars["String"]>;
  logo: Scalars["String"];
  logoHeight?: InputMaybe<Scalars["Float"]>;
  name: Scalars["String"];
  primaryColor: Scalars["String"];
  telegram?: InputMaybe<Scalars["String"]>;
  twitter?: InputMaybe<Scalars["String"]>;
  website?: InputMaybe<Scalars["String"]>;
};

export type CustomLink = {
  __typename?: "CustomLink";
  label: Scalars["String"];
  url: Scalars["String"];
};

export type CustomLinkInput = {
  label: Scalars["String"];
  url: Scalars["String"];
};

export type EventInput = {
  assetId: Scalars["ID"];
  assetType: AssetType;
  type: EventType;
};

export enum EventType {
  View = "VIEW",
}

export type Fees = {
  __typename?: "Fees";
  buyerFee?: Maybe<Scalars["Float"]>;
  payoutAddress?: Maybe<Scalars["String"]>;
};

export type FeesInput = {
  buyerFee?: InputMaybe<Scalars["Float"]>;
  payoutAddress?: InputMaybe<Scalars["String"]>;
};

export enum FileType {
  Image = "IMAGE",
  Video = "VIDEO",
}

export type FineHolderBenefits = {
  __typename?: "FineHolderBenefits";
  auctionAllowance?: Maybe<Scalars["Float"]>;
  avgFineTokenBalance?: Maybe<Scalars["Float"]>;
  mintAllowance?: Maybe<Scalars["Float"]>;
  rarityLimit?: Maybe<Scalars["Float"]>;
  royaltyLimit?: Maybe<Scalars["Float"]>;
  taggingLimit?: Maybe<Scalars["Float"]>;
  userBenefitLevel?: Maybe<Scalars["String"]>;
};

export type FinishMintInput = {
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
  transactionHash: Scalars["String"];
};

export type FinishMintOutput = {
  __typename?: "FinishMintOutput";
  item: Item;
};

export type GetMetadataInput = {
  chainId: Scalars["Int"];
  contractAddress: Scalars["String"];
};

export type GetMetadataOutput = {
  __typename?: "GetMetadataOutput";
  attributes: Array<ItemAttributeOutput>;
  description?: Maybe<Scalars["String"]>;
  external_url?: Maybe<Scalars["String"]>;
  image?: Maybe<Scalars["String"]>;
  name: Scalars["String"];
  video?: Maybe<Scalars["String"]>;
};

export type GetPurchaseSessionInput = {
  id: Scalars["String"];
};

export type GetRefinableContractInput = {
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
  types?: InputMaybe<Array<ContractTypes>>;
};

export type GetRefinableContractsInput = {
  chainId?: InputMaybe<Scalars["Float"]>;
  tags?: InputMaybe<Array<ContractTag>>;
  types?: InputMaybe<Array<ContractTypes>>;
};

export type GetUploadUrlOutput = {
  __typename?: "GetUploadUrlOutput";
  fields: Scalars["JSON"];
  url: Scalars["String"];
};

export type HideItemInput = {
  id: Scalars["String"];
  reason: Scalars["String"];
};

export type HotItemsResponse = {
  __typename?: "HotItemsResponse";
  result: Array<HotResult>;
};

export type HotResult = ItemWithOffer;

export type HottestTagsFilterInput = {
  interval: Taginterval;
  /** Amount of records to show, max is 50 */
  limit?: InputMaybe<Scalars["Int"]>;
};

export type ImportCollectionInput = {
  bannerUrl?: InputMaybe<Scalars["String"]>;
  chainId: Scalars["Float"];
  contractABI?: InputMaybe<Scalars["String"]>;
  contractAddress: Scalars["String"];
  description: Scalars["String"];
  iconUrl: Scalars["String"];
  metadataUrlTemplate?: InputMaybe<Scalars["String"]>;
  name: Scalars["String"];
  slug: Scalars["String"];
  type?: InputMaybe<TokenType>;
};

export type ImportCollectionOutput = {
  __typename?: "ImportCollectionOutput";
  isValid?: Maybe<Scalars["Boolean"]>;
  metadataUrlTemplate?: Maybe<Scalars["String"]>;
  randomTokenUrl?: Maybe<Scalars["String"]>;
  tokenABI?: Maybe<Scalars["String"]>;
  tokenType?: Maybe<TokenType>;
};

export type ImportItemInput = {
  apiUrl: Scalars["String"];
  chainId: Scalars["Int"];
  contractAddress: Scalars["String"];
  tags?: InputMaybe<Array<TagInput>>;
  tokenId: Scalars["String"];
};

export type ImportItemPreview = {
  __typename?: "ImportItemPreview";
  apiUrl?: Maybe<Scalars["String"]>;
  apiUrlFound?: Maybe<Scalars["Boolean"]>;
  description: Scalars["String"];
  file: Scalars["String"];
  name: Scalars["String"];
};

export type ImportItemPreviewInput = {
  apiUrl: Scalars["String"];
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
};

export type ImportSolanaCollectionInput = {
  chainId: Scalars["Float"];
  creator?: InputMaybe<Scalars["String"]>;
  description: Scalars["String"];
  iconUrl: Scalars["String"];
  name: Scalars["String"];
  slug: Scalars["String"];
  updateAuthority?: InputMaybe<Scalars["String"]>;
};

export type IndexCollectionInput = {
  chainId: Scalars["Int"];
  contractAddress: Scalars["String"];
};

export type Item = {
  __typename?: "Item";
  attributes?: Maybe<Array<ItemAttribute>>;
  availableUserSupply: Scalars["Int"];
  chainId: Scalars["Float"];
  collection?: Maybe<Collection>;
  contractAddress: Scalars["String"];
  createdAt: Scalars["DateTime"];
  creator: User;
  description?: Maybe<Scalars["String"]>;
  editionsForSale: Array<Offer>;
  history: ItemHistoryResponse;
  id: Scalars["String"];
  isLiked: Scalars["Boolean"];
  likes?: Maybe<Scalars["Float"]>;
  marketingDescription?: Maybe<Scalars["String"]>;
  name: Scalars["String"];
  nextEditionForSale?: Maybe<Offer>;
  owners: Array<ItemOwner>;
  properties: Properties;
  reason?: Maybe<Scalars["String"]>;
  royalties?: Maybe<Scalars["Float"]>;
  similarItems: Array<ItemWithOffer>;
  supply: Scalars["Float"];
  tags: Array<Tag>;
  tokenId: Scalars["String"];
  totalSupply: Scalars["Int"];
  transactionHash: Scalars["String"];
  transcodings?: Maybe<Array<Transcoding>>;
  type: TokenType;
  userSupply: Scalars["Int"];
  viewCount: Scalars["Int"];
};

export type ItemAvailableUserSupplyArgs = {
  ethAddress?: InputMaybe<Scalars["String"]>;
};

export type ItemHistoryArgs = {
  paging: PagingInput;
};

export type ItemNextEditionForSaleArgs = {
  ethAddress?: InputMaybe<Scalars["String"]>;
};

export type ItemSimilarItemsArgs = {
  limit: Scalars["Int"];
};

export type ItemUserSupplyArgs = {
  ethAddress?: InputMaybe<Scalars["String"]>;
};

export type ItemAttribute = {
  __typename?: "ItemAttribute";
  displayType?: Maybe<Scalars["String"]>;
  traitType?: Maybe<Scalars["String"]>;
  value: Scalars["String"];
};

export type ItemAttributeOutput = {
  __typename?: "ItemAttributeOutput";
  displayType?: Maybe<Scalars["String"]>;
  maxValue?: Maybe<Scalars["String"]>;
  traitType?: Maybe<Scalars["String"]>;
  value: Scalars["String"];
};

export type ItemEdge = {
  __typename?: "ItemEdge";
  cursor: Scalars["String"];
  node: Item;
};

export type ItemHistory = {
  __typename?: "ItemHistory";
  causedBy?: Maybe<User>;
  createdAt?: Maybe<Scalars["DateTime"]>;
  /** @deprecated As we are supporting multiple chains, the frontend will have the correct explorerUri */
  externalTxUrl?: Maybe<Scalars["String"]>;
  from?: Maybe<User>;
  id: Scalars["String"];
  price?: Maybe<Price>;
  to?: Maybe<User>;
  transactionHash?: Maybe<Scalars["String"]>;
  type?: Maybe<ItemHistoryType>;
};

export type ItemHistoryEdge = {
  __typename?: "ItemHistoryEdge";
  cursor: Scalars["String"];
  node: ItemHistory;
};

export type ItemHistoryPageInfo = {
  __typename?: "ItemHistoryPageInfo";
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type ItemHistoryResponse = {
  __typename?: "ItemHistoryResponse";
  edges?: Maybe<Array<ItemHistoryEdge>>;
  pageInfo?: Maybe<ItemHistoryPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export enum ItemHistoryType {
  Airdrop = "AIRDROP",
  AuctionCancelled = "AUCTION_CANCELLED",
  AuctionClosed = "AUCTION_CLOSED",
  AuctionCreated = "AUCTION_CREATED",
  Bid = "BID",
  Burn = "BURN",
  Minted = "MINTED",
  Purchase = "PURCHASE",
  SaleClosed = "SALE_CLOSED",
  SaleCreated = "SALE_CREATED",
  Transfer = "TRANSFER",
}

export type ItemMinted = {
  __typename?: "ItemMinted";
  contractAddress: Scalars["String"];
  ethAddress: Scalars["String"];
  tokenId: Scalars["String"];
  transactionHash: Scalars["String"];
};

export type ItemOwner = {
  __typename?: "ItemOwner";
  ethAddress: Scalars["String"];
  name?: Maybe<Scalars["String"]>;
  profileImage?: Maybe<Scalars["String"]>;
  supply: Scalars["Float"];
  verified?: Maybe<Scalars["Boolean"]>;
};

export type ItemPageInfo = {
  __typename?: "ItemPageInfo";
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type ItemReport = {
  __typename?: "ItemReport";
  comment?: Maybe<Scalars["String"]>;
  handledBy?: Maybe<User>;
  id: Scalars["String"];
  item?: Maybe<Item>;
  reason: ItemReportReason;
  reportedAt: Scalars["DateTime"];
  reporter?: Maybe<User>;
};

export type ItemReportEdge = {
  __typename?: "ItemReportEdge";
  cursor: Scalars["String"];
  node: ItemReport;
};

export type ItemReportFilterInput = {
  active?: InputMaybe<Scalars["Boolean"]>;
  reason?: InputMaybe<ItemReportReason>;
};

export type ItemReportInput = {
  comment?: InputMaybe<Scalars["String"]>;
  itemId: Scalars["String"];
  reason: ItemReportReason;
};

export type ItemReportPageInfo = {
  __typename?: "ItemReportPageInfo";
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export enum ItemReportReason {
  CopyrightViolation = "COPYRIGHT_VIOLATION",
  NoReason = "NO_REASON",
  Nsfw = "NSFW",
}

export type ItemReportResponse = {
  __typename?: "ItemReportResponse";
  edges?: Maybe<Array<ItemReportEdge>>;
  pageInfo?: Maybe<ItemReportPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export type ItemWithOffer = {
  __typename?: "ItemWithOffer";
  /** @deprecated Not used */
  availableSupply?: Maybe<Scalars["Int"]>;
  cheapestEditionForSale?: Maybe<Offer>;
  editionsForSale: Array<Offer>;
  id: Scalars["String"];
  item: Item;
  nextEditionForSale?: Maybe<Offer>;
};

export type ItemWithOfferEdge = {
  __typename?: "ItemWithOfferEdge";
  cursor: Scalars["String"];
  node: ItemWithOffer;
};

export type ItemWithOfferPageInfo = {
  __typename?: "ItemWithOfferPageInfo";
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type ItemsFilterInput = {
  auctionType?: InputMaybe<AuctionType>;
  chainIds?: InputMaybe<Array<Scalars["String"]>>;
  collectionIds?: InputMaybe<Array<Scalars["String"]>>;
  collectionSlugs?: InputMaybe<Array<Scalars["String"]>>;
  contentType?: InputMaybe<ContentType>;
  currencies?: InputMaybe<Array<PriceCurrency>>;
  offerTypes?: InputMaybe<Array<OfferType>>;
  tagName?: InputMaybe<Scalars["String"]>;
  titleQuery?: InputMaybe<Scalars["String"]>;
};

export type ItemsResponse = {
  __typename?: "ItemsResponse";
  edges?: Maybe<Array<ItemEdge>>;
  pageInfo?: Maybe<ItemPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export type ItemsWithOffersResponse = {
  __typename?: "ItemsWithOffersResponse";
  edges?: Maybe<Array<ItemWithOfferEdge>>;
  pageInfo?: Maybe<ItemWithOfferPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export enum LaunchpadCountDownType {
  Live = "LIVE",
  Private = "PRIVATE",
  Public = "PUBLIC",
  Vip = "VIP",
}

export type LaunchpadDetails = {
  __typename?: "LaunchpadDetails";
  currentStage?: Maybe<LaunchpadStage>;
  nextStage?: Maybe<LaunchpadStage>;
  /** @deprecated Deprecated in favour of `stages` */
  privateStartDate?: Maybe<Scalars["DateTime"]>;
  /** @deprecated Deprecated in favour of `stages` */
  publicStartDate?: Maybe<Scalars["DateTime"]>;
  stages: Array<LaunchpadStage>;
  /** @deprecated Deprecated in favour of `stages` */
  vipStartDate?: Maybe<Scalars["DateTime"]>;
};

export type LaunchpadDetailsInput = {
  stages?: InputMaybe<Array<LaunchpadStageInput>>;
};

export type LaunchpadStage = {
  __typename?: "LaunchpadStage";
  price?: Maybe<Scalars["Float"]>;
  stage: WhitelistType;
  startTime?: Maybe<Scalars["DateTime"]>;
  whitelist?: Maybe<Array<Scalars["String"]>>;
};

export type LaunchpadStageInput = {
  price?: InputMaybe<Scalars["Float"]>;
  stage: WhitelistType;
  startTime?: InputMaybe<Scalars["DateTime"]>;
  whitelist?: InputMaybe<Array<Scalars["String"]>>;
};

export type LoginInput = {
  chainId?: InputMaybe<Scalars["Float"]>;
  ethAddress: Scalars["String"];
  signature: Scalars["String"];
  source?: InputMaybe<Scalars["String"]>;
  type?: InputMaybe<UserType>;
  walletType?: InputMaybe<Scalars["String"]>;
};

export type MarketConfig = {
  __typename?: "MarketConfig";
  buyServiceFeeBps?: Maybe<ServiceFee>;
  data: Scalars["String"];
  signature: Scalars["String"];
};

export type MetadataValuePossibility = {
  __typename?: "MetadataValuePossibility";
  count: Scalars["Float"];
  value?: Maybe<Scalars["String"]>;
};

export type Mutation = {
  __typename?: "Mutation";
  createContract: ContractOutput;
  createEvent: Scalars["Boolean"];
  createItem: CreateItemOutput;
  createMintOffer: Offer;
  createOfferForItems: Offer;
  createPurchase: Purchase;
  createPurchaseSession: PurchaseSession;
  createStore: Store;
  dismissReport: ItemReport;
  finishMint: FinishMintOutput;
  generateVerificationToken: Scalars["Int"];
  hideItem: Item;
  importCollection: ImportCollectionOutput;
  importItem: CreateItemOutput;
  importSolanaCollection: Scalars["Boolean"];
  indexCollection: Scalars["Boolean"];
  login: Auth;
  markAllNotificationsAsSeen: Scalars["Boolean"];
  placeAuctionBid: Scalars["Boolean"];
  refreshMetadata: Scalars["Boolean"];
  reportItem: ItemReport;
  toggleLike?: Maybe<Item>;
  updateNotificationSeenStatus: Notification;
  updateStore?: Maybe<UpdateStore>;
  updateUser: User;
  uploadFile: Scalars["String"];
};

export type MutationCreateContractArgs = {
  data: CreateContractInput;
};

export type MutationCreateEventArgs = {
  input: CreateEventInput;
};

export type MutationCreateItemArgs = {
  input: CreateItemInput;
};

export type MutationCreateMintOfferArgs = {
  input: CreateMintOfferInput;
};

export type MutationCreateOfferForItemsArgs = {
  input: CreateOfferInput;
};

export type MutationCreatePurchaseArgs = {
  input: CreatePurchaseInput;
};

export type MutationCreatePurchaseSessionArgs = {
  input: CreatePurchaseSessionInput;
};

export type MutationCreateStoreArgs = {
  data: CreateStoreInput;
};

export type MutationDismissReportArgs = {
  input: Scalars["String"];
};

export type MutationFinishMintArgs = {
  input: FinishMintInput;
};

export type MutationGenerateVerificationTokenArgs = {
  data: VerificationTokenInput;
};

export type MutationHideItemArgs = {
  input: HideItemInput;
};

export type MutationImportCollectionArgs = {
  input: ImportCollectionInput;
};

export type MutationImportItemArgs = {
  input: ImportItemInput;
};

export type MutationImportSolanaCollectionArgs = {
  input: ImportSolanaCollectionInput;
};

export type MutationIndexCollectionArgs = {
  input: IndexCollectionInput;
};

export type MutationLoginArgs = {
  data: LoginInput;
};

export type MutationPlaceAuctionBidArgs = {
  input: AuctionPlaceBidInput;
};

export type MutationRefreshMetadataArgs = {
  input: RefreshMetadataInput;
};

export type MutationReportItemArgs = {
  input: ItemReportInput;
};

export type MutationToggleLikeArgs = {
  itemId: Scalars["String"];
};

export type MutationUpdateNotificationSeenStatusArgs = {
  id: Scalars["String"];
};

export type MutationUpdateStoreArgs = {
  data: UpdateStoreInput;
  id: Scalars["ID"];
};

export type MutationUpdateUserArgs = {
  data: UpdateUserInput;
};

export type MutationUploadFileArgs = {
  file: Scalars["Upload"];
};

export type Notification = {
  __typename?: "Notification";
  createdAt?: Maybe<Scalars["DateTime"]>;
  eventId?: Maybe<Scalars["String"]>;
  id: Scalars["String"];
  item?: Maybe<Item>;
  notificationType: NotificationType;
  seen: Scalars["Boolean"];
  seenAt?: Maybe<Scalars["DateTime"]>;
};

export type NotificationEdge = {
  __typename?: "NotificationEdge";
  cursor: Scalars["String"];
  node: Notification;
};

export type NotificationPageInfo = {
  __typename?: "NotificationPageInfo";
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type NotificationResponse = {
  __typename?: "NotificationResponse";
  edges?: Maybe<Array<NotificationEdge>>;
  pageInfo?: Maybe<NotificationPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export enum NotificationType {
  AuctionCancelledNotification = "AUCTION_CANCELLED_NOTIFICATION",
  AuctionClosedNotification = "AUCTION_CLOSED_NOTIFICATION",
  AuctionConcludedNotification = "AUCTION_CONCLUDED_NOTIFICATION",
  AuctionEndedWithoutBidNotification = "AUCTION_ENDED_WITHOUT_BID_NOTIFICATION",
  AuctionEndedWithBidNotification = "AUCTION_ENDED_WITH_BID_NOTIFICATION",
  BidderWithHighestBidNotification = "BIDDER_WITH_HIGHEST_BID_NOTIFICATION",
  BidderWonAuctionNotification = "BIDDER_WON_AUCTION_NOTIFICATION",
  BidOutbidHighestBidderNotification = "BID_OUTBID_HIGHEST_BIDDER_NOTIFICATION",
  BidReceivedNotification = "BID_RECEIVED_NOTIFICATION",
  ItemPurchasedNotification = "ITEM_PURCHASED_NOTIFICATION",
  ItemSoldNotification = "ITEM_SOLD_NOTIFICATION",
  NotifyOwnerOnCloseNotification = "NOTIFY_OWNER_ON_CLOSE_NOTIFICATION",
  RemindToCloseAuctionNotification = "REMIND_TO_CLOSE_AUCTION_NOTIFICATION",
}

export type NotificationsFilterInput = {
  status?: InputMaybe<NotificationsFilterType>;
};

export enum NotificationsFilterType {
  Seen = "SEEN",
  Unseen = "UNSEEN",
}

export type Offer = {
  __typename?: "Offer";
  active: Scalars["Boolean"];
  auction?: Maybe<Auction>;
  blockchainId?: Maybe<Scalars["String"]>;
  contract?: Maybe<ContractOutput>;
  createdAt?: Maybe<Scalars["DateTime"]>;
  endTime?: Maybe<Scalars["DateTime"]>;
  id: Scalars["String"];
  item?: Maybe<Item>;
  launchpadDetails?: Maybe<LaunchpadDetails>;
  marketConfig: MarketConfig;
  platform?: Maybe<Platform>;
  price: Price;
  signature?: Maybe<Scalars["String"]>;
  startTime?: Maybe<Scalars["DateTime"]>;
  supply: Scalars["Int"];
  totalSupply: Scalars["Int"];
  type: OfferType;
  unlistedAt?: Maybe<Scalars["DateTime"]>;
  user: User;
  whitelistStage: LaunchpadCountDownType;
  whitelistVoucher?: Maybe<WhitelistVoucher>;
};

export type OfferMarketConfigArgs = {
  storeId?: InputMaybe<Scalars["ID"]>;
};

export enum OfferType {
  Auction = "AUCTION",
  Mint = "MINT",
  Sale = "SALE",
}

export type PagingInput = {
  /** Paginate after opaque cursor */
  after?: InputMaybe<Scalars["String"]>;
  /** Paginate before opaque cursor */
  before?: InputMaybe<Scalars["String"]>;
  /** Paginate first */
  first?: InputMaybe<Scalars["Float"]>;
  /** Paginate last */
  last?: InputMaybe<Scalars["Float"]>;
};

export enum Platform {
  Looksrare = "LOOKSRARE",
  Refinable = "REFINABLE",
}

export type Price = {
  __typename?: "Price";
  amount: Scalars["Float"];
  currency: PriceCurrency;
  priceInUSD?: Maybe<Scalars["Float"]>;
};

export enum PriceCurrency {
  Bnb = "BNB",
  Busd = "BUSD",
  Eth = "ETH",
  Fine = "FINE",
  Matic = "MATIC",
  Sol = "SOL",
  Usdc = "USDC",
  Usdt = "USDT",
  Weth = "WETH",
}

export type PriceInput = {
  amount: Scalars["Float"];
  currency: PriceCurrency;
};

export type Properties = {
  __typename?: "Properties";
  fileKey?: Maybe<Scalars["String"]>;
  fileType: FileType;
  fileUrl?: Maybe<Scalars["String"]>;
  imagePreview?: Maybe<Scalars["String"]>;
  ipfsDocument?: Maybe<Scalars["String"]>;
  ipfsUrl?: Maybe<Scalars["String"]>;
  mimeType?: Maybe<Scalars["String"]>;
  originalFileUrl?: Maybe<Scalars["String"]>;
  originalThumbnailUrl?: Maybe<Scalars["String"]>;
  thumbnailUrl?: Maybe<Scalars["String"]>;
};

export type Purchase = {
  __typename?: "Purchase";
  transactionHash: Scalars["String"];
};

export type PurchaseMetadata = {
  acceptedTOS?: InputMaybe<Scalars["Boolean"]>;
  createdAt: Scalars["DateTime"];
  email?: InputMaybe<Scalars["String"]>;
};

export type PurchaseSession = {
  __typename?: "PurchaseSession";
  apiUser: User;
  cancelUrl?: Maybe<Scalars["String"]>;
  id: Scalars["String"];
  offer: Offer;
  successUrl?: Maybe<Scalars["String"]>;
  url: Scalars["String"];
};

export type Query = {
  __typename?: "Query";
  auction?: Maybe<Auction>;
  brands: Array<Brand>;
  collection?: Maybe<Collection>;
  collectionMetadataValues: Array<CollectionMetadataValues>;
  collections: CollectionsResponse;
  collectionsExist: Array<Scalars["Boolean"]>;
  contractCount: ContractCount;
  getMetadata?: Maybe<GetMetadataOutput>;
  getUploadUrl: GetUploadUrlOutput;
  hotCollections: CollectionsResponse;
  hotItems: HotItemsResponse;
  hottestTags: Array<Tag>;
  importPreview: ImportItemPreview;
  isDomainTaken: Scalars["Boolean"];
  item?: Maybe<Item>;
  itemsOnOffer: ItemsWithOffersResponse;
  me: User;
  mintableCollections: Array<Collection>;
  notifications: NotificationResponse;
  offer?: Maybe<Offer>;
  purchaseSession: PurchaseSession;
  refinableContract?: Maybe<ContractOutput>;
  refinableContracts: Array<ContractOutput>;
  reports: ItemReportResponse;
  search: SearchResponse;
  store?: Maybe<Store>;
  storeWithFallback?: Maybe<Store>;
  /** @deprecated tag creation limit is not supported anymore */
  tagCreationUserSuspended: TagSuspensionOutput;
  topUsers: Array<TopUser>;
  user?: Maybe<User>;
};

export type QueryAuctionArgs = {
  id?: InputMaybe<Scalars["ID"]>;
};

export type QueryCollectionArgs = {
  chainId?: InputMaybe<Scalars["Int"]>;
  collectionId?: InputMaybe<Scalars["String"]>;
  contractAddress?: InputMaybe<Scalars["String"]>;
  slug?: InputMaybe<Scalars["String"]>;
};

export type QueryCollectionMetadataValuesArgs = {
  input: CollectionMetadataValuesInput;
};

export type QueryCollectionsArgs = {
  filter?: InputMaybe<CollectionsFilterInput>;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type QueryCollectionsExistArgs = {
  input: CheckCollectionsInput;
};

export type QueryContractCountArgs = {
  chainId: Scalars["Int"];
  contractAddress: Scalars["String"];
};

export type QueryGetMetadataArgs = {
  input: GetMetadataInput;
};

export type QueryGetUploadUrlArgs = {
  contentType: Scalars["String"];
  fileName: Scalars["String"];
  type: UploadType;
};

export type QueryHotItemsArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
  type: AssetType;
};

export type QueryHottestTagsArgs = {
  filter: HottestTagsFilterInput;
};

export type QueryImportPreviewArgs = {
  input: ImportItemPreviewInput;
};

export type QueryIsDomainTakenArgs = {
  domain: Scalars["String"];
};

export type QueryItemArgs = {
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
};

export type QueryItemsOnOfferArgs = {
  filter?: InputMaybe<ItemsFilterInput>;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type QueryNotificationsArgs = {
  filter?: InputMaybe<NotificationsFilterInput>;
  paging: PagingInput;
};

export type QueryOfferArgs = {
  id?: InputMaybe<Scalars["ID"]>;
};

export type QueryPurchaseSessionArgs = {
  input: GetPurchaseSessionInput;
};

export type QueryRefinableContractArgs = {
  input: GetRefinableContractInput;
};

export type QueryRefinableContractsArgs = {
  input: GetRefinableContractsInput;
};

export type QueryReportsArgs = {
  filter?: InputMaybe<ItemReportFilterInput>;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type QuerySearchArgs = {
  filter: SearchFilterInput;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
  type: AssetType;
};

export type QueryStoreArgs = {
  domain?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["String"]>;
  isExternal?: InputMaybe<Scalars["Boolean"]>;
};

export type QueryStoreWithFallbackArgs = {
  input: StoreWithFallbackInput;
};

export type QueryTopUsersArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
};

export type QueryUserArgs = {
  ethAddress: Scalars["String"];
};

export type RefinableContractInput = {
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
  contractType: ContractTypes;
};

export type RefreshMetadataInput = {
  chainId: Scalars["Int"];
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
  type: Scalars["String"];
};

export type RoyaltiesInput = {
  recipient: Scalars["String"];
  value: Scalars["Int"];
};

export type RoyaltySettingsInput = {
  royaltyBps?: InputMaybe<Scalars["Float"]>;
  royaltyStrategy: RoyaltyStrategy;
  shares?: InputMaybe<Array<RoyaltiesInput>>;
};

export enum RoyaltyStrategy {
  ProfitDistributionStrategy = "PROFIT_DISTRIBUTION_STRATEGY",
  StandardRoyaltyStrategy = "STANDARD_ROYALTY_STRATEGY",
}

export type SearchFilterInput = {
  auctionType?: InputMaybe<AuctionType>;
  chainIds?: InputMaybe<Array<Scalars["String"]>>;
  collectionIds?: InputMaybe<Array<Scalars["String"]>>;
  collectionSlugs?: InputMaybe<Array<Scalars["String"]>>;
  contentType?: InputMaybe<ContentType>;
  currencies?: InputMaybe<Array<PriceCurrency>>;
  offerTypes?: InputMaybe<Array<OfferType>>;
  query?: InputMaybe<Scalars["String"]>;
  tagName?: InputMaybe<Scalars["String"]>;
  titleQuery?: InputMaybe<Scalars["String"]>;
};

export type SearchResponse = {
  __typename?: "SearchResponse";
  edges?: Maybe<Array<UndefinedEdge>>;
  pageInfo?: Maybe<UndefinedPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export type SearchResult = Collection | ItemWithOffer | Tag | User;

export type ServiceFee = {
  __typename?: "ServiceFee";
  type: ServiceFeeType;
  value: Scalars["Float"];
};

export enum ServiceFeeType {
  Protocol = "PROTOCOL",
  Store = "STORE",
}

export type SortInput = {
  field: Scalars["String"];
  order: SortOrder;
};

export enum SortOrder {
  Asc = "ASC",
  Desc = "DESC",
}

export type Store = {
  __typename?: "Store";
  backgroundColor: Scalars["String"];
  backgroundImage?: Maybe<Scalars["String"]>;
  banner?: Maybe<Scalars["String"]>;
  collectionIds: Array<Scalars["String"]>;
  contracts: Array<Contract>;
  creator?: Maybe<Scalars["String"]>;
  customGa?: Maybe<Scalars["String"]>;
  customLinks?: Maybe<Array<CustomLink>>;
  default: Scalars["Boolean"];
  description: Scalars["String"];
  discord?: Maybe<Scalars["String"]>;
  domain: Scalars["String"];
  email?: Maybe<Scalars["String"]>;
  externalCustomLink?: Maybe<Scalars["String"]>;
  favicon?: Maybe<Scalars["String"]>;
  fees?: Maybe<Fees>;
  fontFamily?: Maybe<Scalars["String"]>;
  id: Scalars["String"];
  instagram?: Maybe<Scalars["String"]>;
  isCreator: Scalars["Boolean"];
  items: ItemsWithOffersResponse;
  logo: Scalars["String"];
  logoHeight?: Maybe<Scalars["Float"]>;
  name: Scalars["String"];
  primaryColor: Scalars["String"];
  primaryFontColor?: Maybe<Scalars["String"]>;
  secondaryColor?: Maybe<Scalars["String"]>;
  secondaryFontColor?: Maybe<Scalars["String"]>;
  telegram?: Maybe<Scalars["String"]>;
  twitter?: Maybe<Scalars["String"]>;
  website?: Maybe<Scalars["String"]>;
};

export type StoreItemsArgs = {
  filter?: InputMaybe<CollectionMetadataFilterInput>;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type StoreWithFallbackInput = {
  domain?: InputMaybe<Scalars["String"]>;
  isExternal?: InputMaybe<Scalars["Boolean"]>;
  purchaseSessionId?: InputMaybe<Scalars["String"]>;
};

export type Subscription = {
  __typename?: "Subscription";
  auctionCancelled: Offer;
  auctionEnded: Offer;
  bidPlaced: Offer;
  historyInserted: ItemHistory;
  itemBurned: Item;
  itemMinted: ItemMinted;
  itemPurchased: Item;
  itemTransfered: Item;
  newNotification: Notification;
  offerUpdated?: Maybe<Offer>;
  saleCancelled: Offer;
};

export type SubscriptionAuctionCancelledArgs = {
  offerId: Scalars["ID"];
};

export type SubscriptionAuctionEndedArgs = {
  offerId: Scalars["ID"];
};

export type SubscriptionBidPlacedArgs = {
  offerId: Scalars["ID"];
};

export type SubscriptionHistoryInsertedArgs = {
  itemId: Scalars["ID"];
};

export type SubscriptionItemBurnedArgs = {
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
};

export type SubscriptionItemMintedArgs = {
  contractAddress: Scalars["String"];
  ethAddress: Scalars["String"];
  tokenId: Scalars["String"];
};

export type SubscriptionItemPurchasedArgs = {
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
};

export type SubscriptionItemTransferedArgs = {
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
};

export type SubscriptionOfferUpdatedArgs = {
  offerId: Scalars["ID"];
};

export type SubscriptionSaleCancelledArgs = {
  offerId: Scalars["ID"];
};

export enum Taginterval {
  Day = "DAY",
  Month = "MONTH",
  Week = "WEEK",
  Year = "YEAR",
}

export type Tag = {
  __typename?: "Tag";
  name: Scalars["String"];
  timesUsed: Scalars["Int"];
};

export type TagInput = {
  name: Scalars["String"];
};

export type TagSuspensionOutput = {
  __typename?: "TagSuspensionOutput";
  /** @deprecated We will use total number of allowances instead of boolean suspended */
  isSuspended?: Maybe<Scalars["Boolean"]>;
  /** @deprecated No more creation limit is needed */
  tagCreationAllowance?: Maybe<Scalars["Int"]>;
};

export type Token = {
  __typename?: "Token";
  chainId: Scalars["Int"];
  contractABI: Scalars["String"];
  contractAddress: Scalars["String"];
  tags: Array<ContractTag>;
  type: TokenType;
};

export enum TokenType {
  Erc721 = "ERC721",
  Erc1155 = "ERC1155",
  Spl = "SPL",
}

export type TopUser = {
  __typename?: "TopUser";
  avgMonthlyVolume: Scalars["Float"];
  totalMonthlyVolume: Scalars["Float"];
  user: User;
};

export type Transaction = {
  __typename?: "Transaction";
  blockNumber: Scalars["Float"];
  from: Scalars["String"];
  hash: Scalars["String"];
  to: Scalars["String"];
};

export type Transcoding = {
  __typename?: "Transcoding";
  mimeType: Scalars["String"];
  url: Scalars["String"];
};

export type UpdateStore = {
  __typename?: "UpdateStore";
  store: Store;
  success: Scalars["Boolean"];
};

export type UpdateStoreInput = {
  backgroundColor?: InputMaybe<Scalars["String"]>;
  banner?: InputMaybe<Scalars["String"]>;
  customGa?: InputMaybe<Scalars["String"]>;
  customLinks?: InputMaybe<Array<CustomLinkInput>>;
  description?: InputMaybe<Scalars["String"]>;
  discord?: InputMaybe<Scalars["String"]>;
  email?: InputMaybe<Scalars["String"]>;
  favicon?: InputMaybe<Scalars["String"]>;
  fees?: InputMaybe<FeesInput>;
  instagram?: InputMaybe<Scalars["String"]>;
  logo?: InputMaybe<Scalars["String"]>;
  logoHeight?: InputMaybe<Scalars["Float"]>;
  name?: InputMaybe<Scalars["String"]>;
  primaryColor?: InputMaybe<Scalars["String"]>;
  telegram?: InputMaybe<Scalars["String"]>;
  twitter?: InputMaybe<Scalars["String"]>;
  website?: InputMaybe<Scalars["String"]>;
};

export type UpdateUserInput = {
  description?: InputMaybe<Scalars["String"]>;
  email?: InputMaybe<Scalars["String"]>;
  instagram?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
  profileBanner?: InputMaybe<Scalars["String"]>;
  profileImage?: InputMaybe<Scalars["String"]>;
  twitter?: InputMaybe<Scalars["String"]>;
  website?: InputMaybe<Scalars["String"]>;
};

export enum UploadType {
  Nft = "NFT",
  UserHeader = "USER_HEADER",
  UserImage = "USER_IMAGE",
}

export type User = {
  __typename?: "User";
  description?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["String"]>;
  ethAddress?: Maybe<Scalars["String"]>;
  fineHolderBenefits?: Maybe<FineHolderBenefits>;
  id: Scalars["String"];
  instagram?: Maybe<Scalars["String"]>;
  items: ItemsResponse;
  itemsLiked: ItemsResponse;
  itemsOnOffer: ItemsWithOffersResponse;
  name?: Maybe<Scalars["String"]>;
  profileBanner?: Maybe<Scalars["String"]>;
  profileImage?: Maybe<Scalars["String"]>;
  receivedComRewards: Scalars["Float"];
  roles?: Maybe<Array<UserRoles>>;
  twitter?: Maybe<Scalars["String"]>;
  verified?: Maybe<Scalars["Boolean"]>;
  website?: Maybe<Scalars["String"]>;
};

export type UserItemsArgs = {
  filter: UserItemFilterInput;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type UserItemsLikedArgs = {
  paging: PagingInput;
};

export type UserItemsOnOfferArgs = {
  filter?: InputMaybe<UserItemOnOfferFilterInput>;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type UserItemFilterInput = {
  type: UserItemFilterType;
};

export enum UserItemFilterType {
  Created = "CREATED",
  Owned = "OWNED",
}

export type UserItemOnOfferFilterInput = {
  chainId?: InputMaybe<Scalars["Int"]>;
  contractAddresses?: InputMaybe<Array<Scalars["String"]>>;
  tokenId?: InputMaybe<Scalars["String"]>;
  type?: InputMaybe<OfferType>;
};

export enum UserRoles {
  Admin = "ADMIN",
  Moderator = "MODERATOR",
  User = "USER",
}

export enum UserType {
  Evm = "Evm",
  Solana = "Solana",
}

export type VerificationTokenInput = {
  ethAddress: Scalars["String"];
  type?: InputMaybe<UserType>;
};

export enum WhitelistType {
  Private = "PRIVATE",
  Public = "PUBLIC",
  Vip = "VIP",
}

export type WhitelistVoucher = {
  __typename?: "WhitelistVoucher";
  limit: Scalars["Float"];
  price: Scalars["Float"];
  signature: Scalars["String"];
  startTime: Scalars["DateTime"];
  whitelistType: WhitelistType;
};

export type UndefinedEdge = {
  __typename?: "undefinedEdge";
  cursor: Scalars["String"];
  node: SearchResult;
};

export type UndefinedPageInfo = {
  __typename?: "undefinedPageInfo";
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type PlaceAuctionBidMutationVariables = Exact<{
  input: AuctionPlaceBidInput;
}>;

export type PlaceAuctionBidMutation = {
  __typename?: "Mutation";
  placeAuctionBid: boolean;
};

export type CreatePurchaseSessionMutationVariables = Exact<{
  input: CreatePurchaseSessionInput;
}>;

export type CreatePurchaseSessionMutation = {
  __typename?: "Mutation";
  createPurchaseSession: { __typename?: "PurchaseSession"; url: string };
};

export type RefinableContractQueryVariables = Exact<{
  input: GetRefinableContractInput;
}>;

export type RefinableContractQuery = {
  __typename?: "Query";
  refinableContract?:
    | {
        __typename?: "ContractOutput";
        contractAddress: string;
        contractABI: string;
        type: string;
        tags: Array<ContractTag>;
        chainId: number;
      }
    | null
    | undefined;
};

export type RefinableContractsQueryVariables = Exact<{
  input: GetRefinableContractsInput;
}>;

export type RefinableContractsQuery = {
  __typename?: "Query";
  refinableContracts: Array<{
    __typename?: "ContractOutput";
    contractAddress: string;
    contractABI: string;
    type: string;
    tags: Array<ContractTag>;
    chainId: number;
  }>;
};

export type GetMintableCollectionsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type GetMintableCollectionsQuery = {
  __typename?: "Query";
  mintableCollections: Array<{
    __typename?: "Collection";
    default: boolean;
    tokens?:
      | Array<{
          __typename?: "Token";
          contractAddress: string;
          contractABI: string;
          type: TokenType;
          chainId: number;
          tags: Array<ContractTag>;
        }>
      | null
      | undefined;
  }>;
};

export type GetCollectionBySlugQueryVariables = Exact<{
  slug: Scalars["String"];
}>;

export type GetCollectionBySlugQuery = {
  __typename?: "Query";
  collection?: { __typename?: "Collection"; slug: string } | null | undefined;
};

export type CreateContractMutationVariables = Exact<{
  data: CreateContractInput;
}>;

export type CreateContractMutation = {
  __typename?: "Mutation";
  createContract: {
    __typename?: "ContractOutput";
    contractAddress: string;
    contractABI: string;
    type: string;
    tags: Array<ContractTag>;
    chainId: number;
  };
};

export type ItemSaleInfoFragment = {
  __typename?: "Offer";
  id: string;
  createdAt?: any | null | undefined;
  type: OfferType;
  supply: number;
  price: { __typename?: "Price"; amount: number; currency: PriceCurrency };
  auction?:
    | {
        __typename?: "Auction";
        id: string;
        startPrice?: number | null | undefined;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        highestBid?:
          | { __typename?: "Bid"; transactionHash: string; bidAmount: number }
          | null
          | undefined;
      }
    | null
    | undefined;
};

export type ItemInfoFragment = {
  __typename?: "Item";
  id: string;
  tokenId: string;
  contractAddress: string;
  supply: number;
  totalSupply: number;
  name: string;
  description?: string | null | undefined;
  chainId: number;
  creator: {
    __typename?: "User";
    id: string;
    ethAddress?: string | null | undefined;
    name?: string | null | undefined;
    profileImage?: string | null | undefined;
    verified?: boolean | null | undefined;
  };
  collection?:
    | {
        __typename?: "Collection";
        slug: string;
        name: string;
        iconUrl: string;
        verified: boolean;
      }
    | null
    | undefined;
  properties: {
    __typename?: "Properties";
    fileType: FileType;
    imagePreview?: string | null | undefined;
    fileUrl?: string | null | undefined;
    originalFileUrl?: string | null | undefined;
    thumbnailUrl?: string | null | undefined;
    originalThumbnailUrl?: string | null | undefined;
  };
  transcodings?:
    | Array<{ __typename?: "Transcoding"; url: string; mimeType: string }>
    | null
    | undefined;
};

export type GetItemsWithOfferFragment = {
  __typename?: "ItemWithOffer";
  id: string;
  item: {
    __typename?: "Item";
    id: string;
    tokenId: string;
    contractAddress: string;
    supply: number;
    totalSupply: number;
    name: string;
    description?: string | null | undefined;
    chainId: number;
    creator: {
      __typename?: "User";
      id: string;
      ethAddress?: string | null | undefined;
      name?: string | null | undefined;
      profileImage?: string | null | undefined;
      verified?: boolean | null | undefined;
    };
    collection?:
      | {
          __typename?: "Collection";
          slug: string;
          name: string;
          iconUrl: string;
          verified: boolean;
        }
      | null
      | undefined;
    properties: {
      __typename?: "Properties";
      fileType: FileType;
      imagePreview?: string | null | undefined;
      fileUrl?: string | null | undefined;
      originalFileUrl?: string | null | undefined;
      thumbnailUrl?: string | null | undefined;
      originalThumbnailUrl?: string | null | undefined;
    };
    transcodings?:
      | Array<{ __typename?: "Transcoding"; url: string; mimeType: string }>
      | null
      | undefined;
  };
  nextEditionForSale?:
    | {
        __typename?: "Offer";
        id: string;
        createdAt?: any | null | undefined;
        type: OfferType;
        supply: number;
        price: {
          __typename?: "Price";
          amount: number;
          currency: PriceCurrency;
        };
        auction?:
          | {
              __typename?: "Auction";
              id: string;
              startPrice?: number | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              highestBid?:
                | {
                    __typename?: "Bid";
                    transactionHash: string;
                    bidAmount: number;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
};

export type UserItemsFragment = {
  __typename?: "Item";
  userSupply: number;
  id: string;
  tokenId: string;
  contractAddress: string;
  supply: number;
  totalSupply: number;
  name: string;
  description?: string | null | undefined;
  chainId: number;
  nextEditionForSale?:
    | {
        __typename?: "Offer";
        id: string;
        createdAt?: any | null | undefined;
        type: OfferType;
        supply: number;
        price: {
          __typename?: "Price";
          amount: number;
          currency: PriceCurrency;
        };
        auction?:
          | {
              __typename?: "Auction";
              id: string;
              startPrice?: number | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              highestBid?:
                | {
                    __typename?: "Bid";
                    transactionHash: string;
                    bidAmount: number;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
  creator: {
    __typename?: "User";
    id: string;
    ethAddress?: string | null | undefined;
    name?: string | null | undefined;
    profileImage?: string | null | undefined;
    verified?: boolean | null | undefined;
  };
  collection?:
    | {
        __typename?: "Collection";
        slug: string;
        name: string;
        iconUrl: string;
        verified: boolean;
      }
    | null
    | undefined;
  properties: {
    __typename?: "Properties";
    fileType: FileType;
    imagePreview?: string | null | undefined;
    fileUrl?: string | null | undefined;
    originalFileUrl?: string | null | undefined;
    thumbnailUrl?: string | null | undefined;
    originalThumbnailUrl?: string | null | undefined;
  };
  transcodings?:
    | Array<{ __typename?: "Transcoding"; url: string; mimeType: string }>
    | null
    | undefined;
};

export type AuctionFragment = {
  __typename?: "Auction";
  id: string;
  auctionId?: string | null | undefined;
  auctionContractAddress?: string | null | undefined;
  startTime?: any | null | undefined;
  endTime?: any | null | undefined;
  startPrice?: number | null | undefined;
  bids: Array<{
    __typename?: "Bid";
    transactionHash: string;
    bidAmount: number;
    bidTime: any;
    bidder?:
      | {
          __typename?: "User";
          ethAddress?: string | null | undefined;
          description?: string | null | undefined;
          name?: string | null | undefined;
          profileImage?: string | null | undefined;
        }
      | null
      | undefined;
  }>;
  highestBid?:
    | {
        __typename?: "Bid";
        transactionHash: string;
        bidAmount: number;
        bidTime: any;
        bidder?:
          | {
              __typename?: "User";
              ethAddress?: string | null | undefined;
              description?: string | null | undefined;
              name?: string | null | undefined;
              profileImage?: string | null | undefined;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
};

export type OfferFragment = {
  __typename?: "Offer";
  id: string;
  type: OfferType;
  active: boolean;
  supply: number;
  totalSupply: number;
  startTime?: any | null | undefined;
  endTime?: any | null | undefined;
  signature?: string | null | undefined;
  blockchainId?: string | null | undefined;
  whitelistStage: LaunchpadCountDownType;
  user: {
    __typename?: "User";
    id: string;
    ethAddress?: string | null | undefined;
  };
  price: { __typename?: "Price"; amount: number; currency: PriceCurrency };
  auction?:
    | {
        __typename?: "Auction";
        id: string;
        auctionId?: string | null | undefined;
        auctionContractAddress?: string | null | undefined;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        startPrice?: number | null | undefined;
        bids: Array<{
          __typename?: "Bid";
          transactionHash: string;
          bidAmount: number;
          bidTime: any;
          bidder?:
            | {
                __typename?: "User";
                ethAddress?: string | null | undefined;
                description?: string | null | undefined;
                name?: string | null | undefined;
                profileImage?: string | null | undefined;
              }
            | null
            | undefined;
        }>;
        highestBid?:
          | {
              __typename?: "Bid";
              transactionHash: string;
              bidAmount: number;
              bidTime: any;
              bidder?:
                | {
                    __typename?: "User";
                    ethAddress?: string | null | undefined;
                    description?: string | null | undefined;
                    name?: string | null | undefined;
                    profileImage?: string | null | undefined;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
  marketConfig: {
    __typename?: "MarketConfig";
    data: string;
    signature: string;
    buyServiceFeeBps?:
      | { __typename?: "ServiceFee"; type: ServiceFeeType; value: number }
      | null
      | undefined;
  };
  whitelistVoucher?:
    | {
        __typename?: "WhitelistVoucher";
        whitelistType: WhitelistType;
        limit: number;
        signature: string;
        startTime: any;
        price: number;
      }
    | null
    | undefined;
};

export type GetUserOfferItemsQueryVariables = Exact<{
  ethAddress: Scalars["String"];
  filter?: InputMaybe<UserItemOnOfferFilterInput>;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
}>;

export type GetUserOfferItemsQuery = {
  __typename?: "Query";
  user?:
    | {
        __typename?: "User";
        id: string;
        itemsOnOffer: {
          __typename?: "ItemsWithOffersResponse";
          totalCount?: number | null | undefined;
          edges?:
            | Array<{
                __typename?: "ItemWithOfferEdge";
                cursor: string;
                node: {
                  __typename?: "ItemWithOffer";
                  id: string;
                  item: {
                    __typename?: "Item";
                    id: string;
                    tokenId: string;
                    contractAddress: string;
                    supply: number;
                    totalSupply: number;
                    name: string;
                    description?: string | null | undefined;
                    chainId: number;
                    creator: {
                      __typename?: "User";
                      id: string;
                      ethAddress?: string | null | undefined;
                      name?: string | null | undefined;
                      profileImage?: string | null | undefined;
                      verified?: boolean | null | undefined;
                    };
                    collection?:
                      | {
                          __typename?: "Collection";
                          slug: string;
                          name: string;
                          iconUrl: string;
                          verified: boolean;
                        }
                      | null
                      | undefined;
                    properties: {
                      __typename?: "Properties";
                      fileType: FileType;
                      imagePreview?: string | null | undefined;
                      fileUrl?: string | null | undefined;
                      originalFileUrl?: string | null | undefined;
                      thumbnailUrl?: string | null | undefined;
                      originalThumbnailUrl?: string | null | undefined;
                    };
                    transcodings?:
                      | Array<{
                          __typename?: "Transcoding";
                          url: string;
                          mimeType: string;
                        }>
                      | null
                      | undefined;
                  };
                  nextEditionForSale?:
                    | {
                        __typename?: "Offer";
                        id: string;
                        createdAt?: any | null | undefined;
                        type: OfferType;
                        supply: number;
                        price: {
                          __typename?: "Price";
                          amount: number;
                          currency: PriceCurrency;
                        };
                        auction?:
                          | {
                              __typename?: "Auction";
                              id: string;
                              startPrice?: number | null | undefined;
                              startTime?: any | null | undefined;
                              endTime?: any | null | undefined;
                              highestBid?:
                                | {
                                    __typename?: "Bid";
                                    transactionHash: string;
                                    bidAmount: number;
                                  }
                                | null
                                | undefined;
                            }
                          | null
                          | undefined;
                      }
                    | null
                    | undefined;
                };
              }>
            | null
            | undefined;
          pageInfo?:
            | {
                __typename?: "ItemWithOfferPageInfo";
                startCursor?: string | null | undefined;
                endCursor?: string | null | undefined;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
              }
            | null
            | undefined;
        };
      }
    | null
    | undefined;
};

export type GetOfferQueryVariables = Exact<{
  id: Scalars["ID"];
  storeId?: InputMaybe<Scalars["ID"]>;
}>;

export type GetOfferQuery = {
  __typename?: "Query";
  offer?:
    | {
        __typename?: "Offer";
        id: string;
        type: OfferType;
        active: boolean;
        supply: number;
        totalSupply: number;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        signature?: string | null | undefined;
        blockchainId?: string | null | undefined;
        whitelistStage: LaunchpadCountDownType;
        item?:
          | {
              __typename?: "Item";
              id: string;
              type: TokenType;
              tokenId: string;
              contractAddress: string;
              supply: number;
              totalSupply: number;
              chainId: number;
            }
          | null
          | undefined;
        user: {
          __typename?: "User";
          id: string;
          ethAddress?: string | null | undefined;
        };
        price: {
          __typename?: "Price";
          amount: number;
          currency: PriceCurrency;
        };
        auction?:
          | {
              __typename?: "Auction";
              id: string;
              auctionId?: string | null | undefined;
              auctionContractAddress?: string | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              startPrice?: number | null | undefined;
              bids: Array<{
                __typename?: "Bid";
                transactionHash: string;
                bidAmount: number;
                bidTime: any;
                bidder?:
                  | {
                      __typename?: "User";
                      ethAddress?: string | null | undefined;
                      description?: string | null | undefined;
                      name?: string | null | undefined;
                      profileImage?: string | null | undefined;
                    }
                  | null
                  | undefined;
              }>;
              highestBid?:
                | {
                    __typename?: "Bid";
                    transactionHash: string;
                    bidAmount: number;
                    bidTime: any;
                    bidder?:
                      | {
                          __typename?: "User";
                          ethAddress?: string | null | undefined;
                          description?: string | null | undefined;
                          name?: string | null | undefined;
                          profileImage?: string | null | undefined;
                        }
                      | null
                      | undefined;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
        marketConfig: {
          __typename?: "MarketConfig";
          data: string;
          signature: string;
          buyServiceFeeBps?:
            | { __typename?: "ServiceFee"; type: ServiceFeeType; value: number }
            | null
            | undefined;
        };
        whitelistVoucher?:
          | {
              __typename?: "WhitelistVoucher";
              whitelistType: WhitelistType;
              limit: number;
              signature: string;
              startTime: any;
              price: number;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
};

export type GetUserItemsQueryVariables = Exact<{
  ethAddress: Scalars["String"];
  filter: UserItemFilterInput;
  paging: PagingInput;
}>;

export type GetUserItemsQuery = {
  __typename?: "Query";
  user?:
    | {
        __typename?: "User";
        id: string;
        items: {
          __typename?: "ItemsResponse";
          totalCount?: number | null | undefined;
          edges?:
            | Array<{
                __typename?: "ItemEdge";
                cursor: string;
                node: {
                  __typename?: "Item";
                  userSupply: number;
                  id: string;
                  tokenId: string;
                  contractAddress: string;
                  supply: number;
                  totalSupply: number;
                  name: string;
                  description?: string | null | undefined;
                  chainId: number;
                  nextEditionForSale?:
                    | {
                        __typename?: "Offer";
                        id: string;
                        createdAt?: any | null | undefined;
                        type: OfferType;
                        supply: number;
                        price: {
                          __typename?: "Price";
                          amount: number;
                          currency: PriceCurrency;
                        };
                        auction?:
                          | {
                              __typename?: "Auction";
                              id: string;
                              startPrice?: number | null | undefined;
                              startTime?: any | null | undefined;
                              endTime?: any | null | undefined;
                              highestBid?:
                                | {
                                    __typename?: "Bid";
                                    transactionHash: string;
                                    bidAmount: number;
                                  }
                                | null
                                | undefined;
                            }
                          | null
                          | undefined;
                      }
                    | null
                    | undefined;
                  creator: {
                    __typename?: "User";
                    id: string;
                    ethAddress?: string | null | undefined;
                    name?: string | null | undefined;
                    profileImage?: string | null | undefined;
                    verified?: boolean | null | undefined;
                  };
                  collection?:
                    | {
                        __typename?: "Collection";
                        slug: string;
                        name: string;
                        iconUrl: string;
                        verified: boolean;
                      }
                    | null
                    | undefined;
                  properties: {
                    __typename?: "Properties";
                    fileType: FileType;
                    imagePreview?: string | null | undefined;
                    fileUrl?: string | null | undefined;
                    originalFileUrl?: string | null | undefined;
                    thumbnailUrl?: string | null | undefined;
                    originalThumbnailUrl?: string | null | undefined;
                  };
                  transcodings?:
                    | Array<{
                        __typename?: "Transcoding";
                        url: string;
                        mimeType: string;
                      }>
                    | null
                    | undefined;
                };
              }>
            | null
            | undefined;
          pageInfo?:
            | {
                __typename?: "ItemPageInfo";
                startCursor?: string | null | undefined;
                endCursor?: string | null | undefined;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
              }
            | null
            | undefined;
        };
      }
    | null
    | undefined;
};

export type RefreshMetadataMutationVariables = Exact<{
  input: RefreshMetadataInput;
}>;

export type RefreshMetadataMutation = {
  __typename?: "Mutation";
  refreshMetadata: boolean;
};

export type UploadFileMutationVariables = Exact<{
  file: Scalars["Upload"];
}>;

export type UploadFileMutation = {
  __typename?: "Mutation";
  uploadFile: string;
};

export type CreateItemMutationVariables = Exact<{
  input: CreateItemInput;
}>;

export type CreateItemMutation = {
  __typename?: "Mutation";
  createItem: {
    __typename?: "CreateItemOutput";
    signature?: string | null | undefined;
    item: {
      __typename?: "Item";
      id: string;
      tokenId: string;
      contractAddress: string;
      chainId: number;
      supply: number;
      totalSupply: number;
      type: TokenType;
      properties: {
        __typename?: "Properties";
        fileType: FileType;
        imagePreview?: string | null | undefined;
        fileUrl?: string | null | undefined;
        ipfsUrl?: string | null | undefined;
        ipfsDocument?: string | null | undefined;
      };
    };
  };
};

export type FinishMintMutationVariables = Exact<{
  input: FinishMintInput;
}>;

export type FinishMintMutation = {
  __typename?: "Mutation";
  finishMint: {
    __typename?: "FinishMintOutput";
    item: {
      __typename?: "Item";
      id: string;
      tokenId: string;
      contractAddress: string;
      chainId: number;
      supply: number;
      totalSupply: number;
      type: TokenType;
      properties: {
        __typename?: "Properties";
        fileType: FileType;
        imagePreview?: string | null | undefined;
        fileUrl?: string | null | undefined;
        ipfsUrl?: string | null | undefined;
        ipfsDocument?: string | null | undefined;
      };
    };
  };
};

export type CreateOfferForEditionsMutationVariables = Exact<{
  input: CreateOfferInput;
  storeId?: InputMaybe<Scalars["ID"]>;
}>;

export type CreateOfferForEditionsMutation = {
  __typename?: "Mutation";
  createOfferForItems: {
    __typename?: "Offer";
    id: string;
    type: OfferType;
    active: boolean;
    supply: number;
    totalSupply: number;
    startTime?: any | null | undefined;
    endTime?: any | null | undefined;
    signature?: string | null | undefined;
    blockchainId?: string | null | undefined;
    whitelistStage: LaunchpadCountDownType;
    user: {
      __typename?: "User";
      id: string;
      ethAddress?: string | null | undefined;
    };
    price: { __typename?: "Price"; amount: number; currency: PriceCurrency };
    auction?:
      | {
          __typename?: "Auction";
          id: string;
          auctionId?: string | null | undefined;
          auctionContractAddress?: string | null | undefined;
          startTime?: any | null | undefined;
          endTime?: any | null | undefined;
          startPrice?: number | null | undefined;
          bids: Array<{
            __typename?: "Bid";
            transactionHash: string;
            bidAmount: number;
            bidTime: any;
            bidder?:
              | {
                  __typename?: "User";
                  ethAddress?: string | null | undefined;
                  description?: string | null | undefined;
                  name?: string | null | undefined;
                  profileImage?: string | null | undefined;
                }
              | null
              | undefined;
          }>;
          highestBid?:
            | {
                __typename?: "Bid";
                transactionHash: string;
                bidAmount: number;
                bidTime: any;
                bidder?:
                  | {
                      __typename?: "User";
                      ethAddress?: string | null | undefined;
                      description?: string | null | undefined;
                      name?: string | null | undefined;
                      profileImage?: string | null | undefined;
                    }
                  | null
                  | undefined;
              }
            | null
            | undefined;
        }
      | null
      | undefined;
    marketConfig: {
      __typename?: "MarketConfig";
      data: string;
      signature: string;
      buyServiceFeeBps?:
        | { __typename?: "ServiceFee"; type: ServiceFeeType; value: number }
        | null
        | undefined;
    };
    whitelistVoucher?:
      | {
          __typename?: "WhitelistVoucher";
          whitelistType: WhitelistType;
          limit: number;
          signature: string;
          startTime: any;
          price: number;
        }
      | null
      | undefined;
  };
};

export type CreateMintOfferMutationVariables = Exact<{
  input: CreateMintOfferInput;
  storeId?: InputMaybe<Scalars["ID"]>;
}>;

export type CreateMintOfferMutation = {
  __typename?: "Mutation";
  createMintOffer: {
    __typename?: "Offer";
    id: string;
    type: OfferType;
    active: boolean;
    supply: number;
    totalSupply: number;
    startTime?: any | null | undefined;
    endTime?: any | null | undefined;
    signature?: string | null | undefined;
    blockchainId?: string | null | undefined;
    whitelistStage: LaunchpadCountDownType;
    contract?:
      | {
          __typename?: "ContractOutput";
          contractAddress: string;
          chainId: number;
        }
      | null
      | undefined;
    user: {
      __typename?: "User";
      id: string;
      ethAddress?: string | null | undefined;
    };
    price: { __typename?: "Price"; amount: number; currency: PriceCurrency };
    auction?:
      | {
          __typename?: "Auction";
          id: string;
          auctionId?: string | null | undefined;
          auctionContractAddress?: string | null | undefined;
          startTime?: any | null | undefined;
          endTime?: any | null | undefined;
          startPrice?: number | null | undefined;
          bids: Array<{
            __typename?: "Bid";
            transactionHash: string;
            bidAmount: number;
            bidTime: any;
            bidder?:
              | {
                  __typename?: "User";
                  ethAddress?: string | null | undefined;
                  description?: string | null | undefined;
                  name?: string | null | undefined;
                  profileImage?: string | null | undefined;
                }
              | null
              | undefined;
          }>;
          highestBid?:
            | {
                __typename?: "Bid";
                transactionHash: string;
                bidAmount: number;
                bidTime: any;
                bidder?:
                  | {
                      __typename?: "User";
                      ethAddress?: string | null | undefined;
                      description?: string | null | undefined;
                      name?: string | null | undefined;
                      profileImage?: string | null | undefined;
                    }
                  | null
                  | undefined;
              }
            | null
            | undefined;
        }
      | null
      | undefined;
    marketConfig: {
      __typename?: "MarketConfig";
      data: string;
      signature: string;
      buyServiceFeeBps?:
        | { __typename?: "ServiceFee"; type: ServiceFeeType; value: number }
        | null
        | undefined;
    };
    whitelistVoucher?:
      | {
          __typename?: "WhitelistVoucher";
          whitelistType: WhitelistType;
          limit: number;
          signature: string;
          startTime: any;
        }
      | null
      | undefined;
  };
};

export type PurchaseItemMutationVariables = Exact<{
  input: CreatePurchaseInput;
}>;

export type PurchaseItemMutation = {
  __typename?: "Mutation";
  createPurchase: { __typename?: "Purchase"; transactionHash: string };
};
