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
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: any;
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
  /** JWT Bearer token */
  token: Scalars["String"];
  user: AuthUser;
};

export type AuthUser = {
  collectionWatchlist: CollectionsResponse;
  creatorSuiteProfile?: Maybe<CreatorSuiteProfileOutput>;
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
  stores: Array<Store>;
  twitter?: Maybe<Scalars["String"]>;
  verified?: Maybe<Scalars["Boolean"]>;
  website?: Maybe<Scalars["String"]>;
};

export type AuthUserCollectionWatchlistArgs = {
  paging: PagingInput;
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
  bidAmount: Scalars["Float"];
  bidTime: Scalars["DateTime"];
  bidder?: Maybe<User>;
  transactionHash: Scalars["String"];
  verified?: Maybe<Scalars["Boolean"]>;
  verifiedAt?: Maybe<Scalars["DateTime"]>;
};

export type Brand = {
  description: Scalars["String"];
  fileUrl: Scalars["String"];
  id: Scalars["String"];
  link: Scalars["String"];
  name: Scalars["String"];
};

export type CheckCollectionInput = {
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
};

export type Collection = {
  bannerUrl?: Maybe<Scalars["String"]>;
  chainIds: Array<Scalars["Float"]>;
  collectionIds: Array<Scalars["String"]>;
  creator?: Maybe<User>;
  default: Scalars["Boolean"];
  description?: Maybe<Scalars["String"]>;
  discord?: Maybe<Scalars["String"]>;
  hidden?: Maybe<Scalars["Boolean"]>;
  iconUrl?: Maybe<Scalars["String"]>;
  id: Scalars["String"];
  instagram?: Maybe<Scalars["String"]>;
  isAddedToWatchList: Scalars["Boolean"];
  isRefinableCollection: Scalars["Boolean"];
  items: ItemsWithOffersResponse;
  name: Scalars["String"];
  ownerEthAddress?: Maybe<Scalars["String"]>;
  slug: Scalars["String"];
  statistics: CollectionStatistics;
  telegram?: Maybe<Scalars["String"]>;
  tokens: Array<Token>;
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
  cursor: Scalars["String"];
  node: Collection;
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
  platforms?: InputMaybe<Array<Platform>>;
  tagName?: InputMaybe<Scalars["String"]>;
  titleQuery?: InputMaybe<Scalars["String"]>;
};

export type CollectionMetadataValues = {
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
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type CollectionStatistics = {
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
  collectionIds?: InputMaybe<Array<Scalars["String"]>>;
  creator?: InputMaybe<Scalars["String"]>;
  userAddress?: InputMaybe<Scalars["String"]>;
};

export type CollectionsResponse = {
  edges?: Maybe<Array<CollectionEdge>>;
  pageInfo?: Maybe<CollectionPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export enum ContentType {
  CommunityContent = "COMMUNITY_CONTENT",
  VerifiedContent = "VERIFIED_CONTENT",
}

export type ContractCount = {
  minted: Scalars["Int"];
  transfered: Scalars["Int"];
};

export type ContractInput = {
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
  hidden?: InputMaybe<Scalars["Boolean"]>;
};

export type ContractOutput = {
  chainId: Scalars["Int"];
  contractABI: Scalars["String"];
  contractAddress: Scalars["String"];
  id: Scalars["String"];
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
  RoyaltyRegistryV1_0_0 = "ROYALTY_REGISTRY_v1_0_0",
  SaleNonceHolderV1_0_0 = "SALE_NONCE_HOLDER_v1_0_0",
  SaleV1_0_0 = "SALE_v1_0_0",
  SaleV2_0_0 = "SALE_v2_0_0",
  SaleV3_0_0 = "SALE_v3_0_0",
  SaleV3_0_1 = "SALE_v3_0_1",
  SaleV3_1_0 = "SALE_v3_1_0",
  SaleV3_2_0 = "SALE_v3_2_0",
  SaleV4_0_0 = "SALE_v4_0_0",
  SaleV4_1_0 = "SALE_v4_1_0",
  SaleV4_1_1 = "SALE_v4_1_1",
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
  RoyaltyRegistry = "ROYALTY_REGISTRY",
  Sale = "SALE",
  ServiceFeeProxy = "SERVICE_FEE_PROXY",
  ServiceFeeV2 = "SERVICE_FEE_V2",
  TransferProxy = "TRANSFER_PROXY",
}

export type CreateCollectionInput = {
  avatar: Scalars["String"];
  banner?: InputMaybe<Scalars["String"]>;
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
  contractId: Scalars["String"];
  description: Scalars["String"];
  discord?: InputMaybe<Scalars["String"]>;
  instagram?: InputMaybe<Scalars["String"]>;
  name: Scalars["String"];
  symbol: Scalars["String"];
  telegram?: InputMaybe<Scalars["String"]>;
  title?: InputMaybe<Scalars["String"]>;
  tokenType: Scalars["String"];
  twitter?: InputMaybe<Scalars["String"]>;
  website?: InputMaybe<Scalars["String"]>;
};

export type CreateContractInput = {
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
  payee: Scalars["String"];
  previewImage: Scalars["String"];
  price?: InputMaybe<PriceInput>;
  signature: Scalars["String"];
  startTime?: InputMaybe<Scalars["DateTime"]>;
  supply: Scalars["Float"];
  transactionHash?: InputMaybe<Scalars["String"]>;
  type: Scalars["String"];
};

export type CreateOfferInput = {
  blockchainId?: InputMaybe<Scalars["String"]>;
  chainId?: InputMaybe<Scalars["Int"]>;
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
  banner?: InputMaybe<Scalars["String"]>;
  contracts: Array<ContractInput>;
  customLinks?: InputMaybe<Array<CustomLinkInput>>;
  description: Scalars["String"];
  discord?: InputMaybe<Scalars["String"]>;
  domain: Scalars["String"];
  email: Scalars["String"];
  favicon?: InputMaybe<Scalars["String"]>;
  instagram?: InputMaybe<Scalars["String"]>;
  logo?: InputMaybe<Scalars["String"]>;
  logoHeight?: InputMaybe<Scalars["Float"]>;
  name: Scalars["String"];
  primaryColor: Scalars["String"];
  telegram?: InputMaybe<Scalars["String"]>;
  twitter?: InputMaybe<Scalars["String"]>;
  website?: InputMaybe<Scalars["String"]>;
};

export type CreatorSuiteProfileInput = {
  email?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
};

export type CreatorSuiteProfileOutput = {
  email?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
};

export type CustomLink = {
  label: Scalars["String"];
  url: Scalars["String"];
};

export type CustomLinkInput = {
  label: Scalars["String"];
  url: Scalars["String"];
};

export type EventInput = {
  assetId?: InputMaybe<Scalars["ID"]>;
  assetType: AssetType;
  trackData?: InputMaybe<Scalars["JSONObject"]>;
  type: EventType;
};

export enum EventType {
  Track = "TRACK",
  View = "VIEW",
}

export type Fees = {
  buyerFee?: Maybe<Scalars["Float"]>;
  payoutAddress?: Maybe<Scalars["String"]>;
};

export type FeesInput = {
  buyerFee?: InputMaybe<Scalars["Float"]>;
  payoutAddress?: InputMaybe<Scalars["String"]>;
};

export type FiatCheckoutWidgetData = {
  canPurchaseBeExecuted: Scalars["Boolean"];
  externalTransactionId?: Maybe<Scalars["String"]>;
  url?: Maybe<Scalars["String"]>;
};

export enum FileType {
  Image = "IMAGE",
  Video = "VIDEO",
}

export type FindContractInput = {
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
};

export type FineHolderBenefits = {
  auctionAllowance?: Maybe<Scalars["Float"]>;
  avgFineTokenBalance?: Maybe<Scalars["Float"]>;
  /** @deprecated We are removing mintAllowance for all user tiers */
  mintAllowance?: Maybe<Scalars["Float"]>;
  rarityLimit?: Maybe<Scalars["Float"]>;
  royaltyLimit?: Maybe<Scalars["Float"]>;
  taggingLimit?: Maybe<Scalars["Float"]>;
  userBenefitLevel?: Maybe<Scalars["String"]>;
};

export type FinishMintInput = {
  chainId?: InputMaybe<Scalars["Int"]>;
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
  transactionHash: Scalars["String"];
};

export type FinishMintOutput = {
  item: Item;
};

export type GetMetadataInput = {
  chainId: Scalars["Int"];
  contractAddress: Scalars["String"];
  tokenId?: InputMaybe<Scalars["String"]>;
};

export type GetMetadataOutput = {
  attributes: Array<ItemAttributeOutput>;
  description?: Maybe<Scalars["String"]>;
  external_url?: Maybe<Scalars["String"]>;
  image?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  originalMetadata: Scalars["JSONObject"];
  video?: Maybe<Scalars["String"]>;
};

export type GetPurchaseSessionInput = {
  id: Scalars["String"];
};

export type GetRefinableContractInput = {
  chainId: Scalars["Float"];
  contractAddress?: InputMaybe<Scalars["String"]>;
  types?: InputMaybe<Array<ContractTypes>>;
};

export type GetRefinableContractsInput = {
  chainId?: InputMaybe<Scalars["Float"]>;
  tags?: InputMaybe<Array<ContractTag>>;
  types?: InputMaybe<Array<ContractTypes>>;
};

export type GetUploadUrlOutput = {
  fields: Scalars["JSON"];
  url: Scalars["String"];
};

export type HideItemInput = {
  id: Scalars["String"];
  reason: Scalars["String"];
};

export type HotItemsResponse = {
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
  contractAddress: Scalars["String"];
  description: Scalars["String"];
  iconUrl: Scalars["String"];
  name: Scalars["String"];
  slug: Scalars["String"];
  type?: InputMaybe<TokenType>;
};

export type ImportCollectionOutput = {
  isValid?: Maybe<Scalars["Boolean"]>;
  randomTokenUrl?: Maybe<Scalars["String"]>;
  tokenType?: Maybe<TokenType>;
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
  isOwner?: Maybe<Scalars["Boolean"]>;
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
  displayType?: Maybe<Scalars["String"]>;
  traitType?: Maybe<Scalars["String"]>;
  value: Scalars["String"];
};

export type ItemAttributeOutput = {
  displayType?: Maybe<Scalars["String"]>;
  maxValue?: Maybe<Scalars["String"]>;
  traitType?: Maybe<Scalars["String"]>;
  value: Scalars["String"];
};

export type ItemEdge = {
  cursor: Scalars["String"];
  node: Item;
};

export type ItemHistory = {
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
  cursor: Scalars["String"];
  node: ItemHistory;
};

export type ItemHistoryFilterInput = {
  itemId?: InputMaybe<Scalars["ID"]>;
};

export type ItemHistoryPageInfo = {
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type ItemHistoryResponse = {
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
  contractAddress: Scalars["String"];
  ethAddress: Scalars["String"];
  tokenId: Scalars["String"];
  transactionHash: Scalars["String"];
};

export type ItemOwner = {
  ethAddress: Scalars["String"];
  name?: Maybe<Scalars["String"]>;
  profileImage?: Maybe<Scalars["String"]>;
  supply: Scalars["Float"];
  verified?: Maybe<Scalars["Boolean"]>;
};

export type ItemPageInfo = {
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type ItemReport = {
  comment?: Maybe<Scalars["String"]>;
  handledBy?: Maybe<User>;
  id: Scalars["String"];
  item?: Maybe<Item>;
  reason: ItemReportReason;
  reportedAt: Scalars["DateTime"];
  reporter?: Maybe<User>;
};

export type ItemReportEdge = {
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
  edges?: Maybe<Array<ItemReportEdge>>;
  pageInfo?: Maybe<ItemReportPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export type ItemWithOffer = {
  editionsForSale: Array<Offer>;
  id: Scalars["String"];
  item: Item;
  nextEditionForSale?: Maybe<Offer>;
};

export type ItemWithOfferEdge = {
  cursor: Scalars["String"];
  node: ItemWithOffer;
};

export type ItemWithOfferPageInfo = {
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
  platforms?: InputMaybe<Array<Platform>>;
  tagName?: InputMaybe<Scalars["String"]>;
  titleQuery?: InputMaybe<Scalars["String"]>;
};

export type ItemsResponse = {
  edges?: Maybe<Array<ItemEdge>>;
  pageInfo?: Maybe<ItemPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export type ItemsWithOffersResponse = {
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
  currentStage?: Maybe<LaunchpadStage>;
  nextStage?: Maybe<LaunchpadStage>;
  stages: Array<LaunchpadStage>;
};

export type LaunchpadDetailsInput = {
  stages?: InputMaybe<Array<LaunchpadStageInput>>;
};

export type LaunchpadStage = {
  isWhitelisted: Scalars["Boolean"];
  price?: Maybe<Scalars["Float"]>;
  stage: WhitelistType;
  startTime?: Maybe<Scalars["DateTime"]>;
  whitelist?: Maybe<Array<Scalars["String"]>>;
};

export type LaunchpadStageInput = {
  limit?: InputMaybe<Scalars["Float"]>;
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
  buyServiceFeeBps?: Maybe<ServiceFee>;
  data: Scalars["String"];
  signature: Scalars["String"];
};

export type MetadataValuePossibility = {
  count: Scalars["Float"];
  value?: Maybe<Scalars["String"]>;
};

export type MintOffer = Offer & {
  active: Scalars["Boolean"];
  auction?: Maybe<Auction>;
  blockchainId?: Maybe<Scalars["String"]>;
  chainId: Scalars["Int"];
  contract?: Maybe<ContractOutput>;
  contractAddress: Scalars["String"];
  createdAt?: Maybe<Scalars["DateTime"]>;
  description?: Maybe<Scalars["String"]>;
  endTime?: Maybe<Scalars["DateTime"]>;
  id: Scalars["String"];
  item?: Maybe<Item>;
  launchpadDetails?: Maybe<LaunchpadDetails>;
  marketConfig: MarketConfig;
  name?: Maybe<Scalars["String"]>;
  payee: Scalars["String"];
  platform?: Maybe<Platform>;
  previewFile?: Maybe<PreviewFileProperties>;
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

export type MintOfferMarketConfigArgs = {
  storeId?: InputMaybe<Scalars["ID"]>;
};

export type Moonpay = {
  fiatCheckoutWidgetData: FiatCheckoutWidgetData;
};

export type MoonpayFiatCheckoutWidgetDataArgs = {
  offerId: Scalars["ID"];
};

export type Mutation = {
  createCollection: Collection;
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
  importSolanaCollection: Scalars["Boolean"];
  indexCollection: Scalars["Boolean"];
  login: Auth;
  markAllNotificationsAsSeen: Scalars["Boolean"];
  placeAuctionBid: Scalars["Boolean"];
  refreshMetadata: Scalars["Boolean"];
  reportItem: ItemReport;
  toggleAddToWatchList?: Maybe<Collection>;
  toggleHideCollection: UpdateCollectionOutput;
  toggleLike?: Maybe<Item>;
  updateCollection: UpdateCollectionOutput;
  updateNotificationSeenStatus: Notification;
  updateStore?: Maybe<UpdateStore>;
  updateStoreCollections?: Maybe<UpdateStore>;
  updateUser: User;
  uploadFile: Scalars["String"];
  userImportCollection: Collection;
};

export type MutationCreateCollectionArgs = {
  data: CreateCollectionInput;
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

export type MutationToggleAddToWatchListArgs = {
  collectionId: Scalars["String"];
};

export type MutationToggleHideCollectionArgs = {
  id: Scalars["ID"];
};

export type MutationToggleLikeArgs = {
  itemId: Scalars["String"];
};

export type MutationUpdateCollectionArgs = {
  data: UpdateCollectionInput;
  id: Scalars["ID"];
};

export type MutationUpdateNotificationSeenStatusArgs = {
  id: Scalars["String"];
};

export type MutationUpdateStoreArgs = {
  data: UpdateStoreInput;
  id: Scalars["ID"];
};

export type MutationUpdateStoreCollectionsArgs = {
  data: UpdateStoreCollectionsInput;
  id: Scalars["ID"];
};

export type MutationUpdateUserArgs = {
  data: UpdateUserInput;
};

export type MutationUploadFileArgs = {
  file: Scalars["Upload"];
};

export type MutationUserImportCollectionArgs = {
  input: UserImportCollectionInput;
};

export type Notification = {
  createdAt?: Maybe<Scalars["DateTime"]>;
  eventId?: Maybe<Scalars["String"]>;
  id: Scalars["String"];
  item?: Maybe<Item>;
  notificationType: NotificationType;
  seen: Scalars["Boolean"];
  seenAt?: Maybe<Scalars["DateTime"]>;
};

export type NotificationEdge = {
  cursor: Scalars["String"];
  node: Notification;
};

export type NotificationPageInfo = {
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type NotificationResponse = {
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
  ItemMintedNotification = "ITEM_MINTED_NOTIFICATION",
  ItemPurchasedNotification = "ITEM_PURCHASED_NOTIFICATION",
  ItemSoldNotification = "ITEM_SOLD_NOTIFICATION",
  NotifyOwnerOnCloseNotification = "NOTIFY_OWNER_ON_CLOSE_NOTIFICATION",
  NotifySellerItemMintedNotification = "NOTIFY_SELLER_ITEM_MINTED_NOTIFICATION",
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
  active: Scalars["Boolean"];
  auction?: Maybe<Auction>;
  blockchainId?: Maybe<Scalars["String"]>;
  chainId: Scalars["Int"];
  contract?: Maybe<ContractOutput>;
  contractAddress: Scalars["String"];
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
  Opensea = "OPENSEA",
  Refinable = "REFINABLE",
}

export type PreviewFileProperties = {
  fileKey?: Maybe<Scalars["String"]>;
  fileType: FileType;
  fileUrl?: Maybe<Scalars["String"]>;
  imagePreview?: Maybe<Scalars["String"]>;
  mimeType?: Maybe<Scalars["String"]>;
  thumbnailUrl?: Maybe<Scalars["String"]>;
};

export type Price = {
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
  transactionHash: Scalars["String"];
};

export type PurchaseMetadata = {
  acceptedTOS?: InputMaybe<Scalars["Boolean"]>;
  createdAt: Scalars["DateTime"];
  email?: InputMaybe<Scalars["String"]>;
};

export type PurchaseSession = {
  apiUser: User;
  cancelUrl?: Maybe<Scalars["String"]>;
  id: Scalars["String"];
  offer: Offer;
  successUrl?: Maybe<Scalars["String"]>;
  url: Scalars["String"];
};

export type Query = {
  auction?: Maybe<Auction>;
  brands: Array<Brand>;
  collection?: Maybe<Collection>;
  collectionExist?: Maybe<Scalars["String"]>;
  collectionMetadataValues: Array<CollectionMetadataValues>;
  collections: CollectionsResponse;
  contract?: Maybe<ContractOutput>;
  contractCount: ContractCount;
  getMetadata?: Maybe<GetMetadataOutput>;
  getUploadUrl: GetUploadUrlOutput;
  history: ItemHistoryResponse;
  hotCollections: CollectionsResponse;
  hotItems: HotItemsResponse;
  hottestTags: Array<Tag>;
  isCollectionImported: Scalars["Boolean"];
  isDomainTaken: Scalars["Boolean"];
  item?: Maybe<Item>;
  itemsOnOffer: ItemsWithOffersResponse;
  me: User;
  mintableCollections: Array<Collection>;
  moonpay: Moonpay;
  notifications: NotificationResponse;
  offer?: Maybe<Offer>;
  purchaseSession: PurchaseSession;
  refinableContract?: Maybe<ContractOutput>;
  refinableContracts: Array<ContractOutput>;
  reports: ItemReportResponse;
  search: SearchResponse;
  store?: Maybe<Store>;
  storeWithFallback?: Maybe<Store>;
  stores?: Maybe<Array<Store>>;
  topUsers: Array<TopUser>;
  user?: Maybe<User>;
  userSortedCollections: UserSortedCollectionsResponse;
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

export type QueryCollectionExistArgs = {
  input: CheckCollectionInput;
};

export type QueryCollectionMetadataValuesArgs = {
  input: CollectionMetadataValuesInput;
};

export type QueryCollectionsArgs = {
  filter?: InputMaybe<CollectionsFilterInput>;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type QueryContractArgs = {
  input: FindContractInput;
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

export type QueryHistoryArgs = {
  filter: ItemHistoryFilterInput;
  paging: PagingInput;
};

export type QueryHotItemsArgs = {
  limit?: InputMaybe<Scalars["Int"]>;
  type: AssetType;
};

export type QueryHottestTagsArgs = {
  filter: HottestTagsFilterInput;
};

export type QueryIsCollectionImportedArgs = {
  input: CheckCollectionInput;
};

export type QueryIsDomainTakenArgs = {
  domain: Scalars["String"];
};

export type QueryItemArgs = {
  chainId?: InputMaybe<Scalars["Int"]>;
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

export type QueryUserSortedCollectionsArgs = {
  paging: PagingInput;
};

export type RefinableContractInput = {
  chainId: Scalars["Float"];
  contractAbi: Scalars["String"];
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

export type SaleOffer = Offer & {
  active: Scalars["Boolean"];
  auction?: Maybe<Auction>;
  blockchainId?: Maybe<Scalars["String"]>;
  chainId: Scalars["Int"];
  contract?: Maybe<ContractOutput>;
  contractAddress: Scalars["String"];
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

export type SaleOfferMarketConfigArgs = {
  storeId?: InputMaybe<Scalars["ID"]>;
};

export type SearchFilterInput = {
  auctionType?: InputMaybe<AuctionType>;
  chainIds?: InputMaybe<Array<Scalars["String"]>>;
  collectionIds?: InputMaybe<Array<Scalars["String"]>>;
  collectionSlugs?: InputMaybe<Array<Scalars["String"]>>;
  contentType?: InputMaybe<ContentType>;
  currencies?: InputMaybe<Array<PriceCurrency>>;
  offerTypes?: InputMaybe<Array<OfferType>>;
  platforms?: InputMaybe<Array<Platform>>;
  query?: InputMaybe<Scalars["String"]>;
  tagName?: InputMaybe<Scalars["String"]>;
  titleQuery?: InputMaybe<Scalars["String"]>;
};

export type SearchResponse = {
  edges?: Maybe<Array<UndefinedEdge>>;
  pageInfo?: Maybe<UndefinedPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export type SearchResult = Collection | ItemWithOffer | Tag | User;

export type ServiceFee = {
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
  backgroundColor: Scalars["String"];
  backgroundImage?: Maybe<Scalars["String"]>;
  banner?: Maybe<Scalars["String"]>;
  /** @deprecated Use contract.collectionId */
  collectionIds: Array<Scalars["String"]>;
  contracts: Array<StoreContract>;
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
  logo?: Maybe<Scalars["String"]>;
  logoHeight?: Maybe<Scalars["Float"]>;
  name: Scalars["String"];
  primaryColor: Scalars["String"];
  primaryFontColor?: Maybe<Scalars["String"]>;
  secondaryColor?: Maybe<Scalars["String"]>;
  secondaryFontColor?: Maybe<Scalars["String"]>;
  telegram?: Maybe<Scalars["String"]>;
  theme?: Maybe<Scalars["JSON"]>;
  twitter?: Maybe<Scalars["String"]>;
  website?: Maybe<Scalars["String"]>;
};

export type StoreContractsArgs = {
  includeHidden?: InputMaybe<Scalars["Boolean"]>;
};

export type StoreItemsArgs = {
  filter?: InputMaybe<CollectionMetadataFilterInput>;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type StoreContract = {
  chainId: Scalars["Float"];
  collection?: Maybe<Collection>;
  collectionId: Scalars["String"];
  contractAddress: Scalars["String"];
  hidden?: Maybe<Scalars["Boolean"]>;
};

export type StoreWithFallbackInput = {
  domain?: InputMaybe<Scalars["String"]>;
  isExternal?: InputMaybe<Scalars["Boolean"]>;
  purchaseSessionId?: InputMaybe<Scalars["String"]>;
};

export type Subscription = {
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
  name: Scalars["String"];
  timesUsed: Scalars["Int"];
};

export type TagInput = {
  name: Scalars["String"];
};

export type Token = {
  canMint: Scalars["Boolean"];
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
  avgMonthlyVolume: Scalars["Float"];
  totalMonthlyVolume: Scalars["Float"];
  user: User;
};

export type Transaction = {
  blockNumber: Scalars["Float"];
  from: Scalars["String"];
  hash: Scalars["String"];
  to: Scalars["String"];
};

export type Transcoding = {
  mimeType: Scalars["String"];
  url: Scalars["String"];
};

export type UpdateCollectionInput = {
  bannerUrl?: InputMaybe<Scalars["String"]>;
  discord?: InputMaybe<Scalars["String"]>;
  hidden?: InputMaybe<Scalars["Boolean"]>;
  iconUrl?: InputMaybe<Scalars["String"]>;
  instagram?: InputMaybe<Scalars["String"]>;
  telegram?: InputMaybe<Scalars["String"]>;
  twitter?: InputMaybe<Scalars["String"]>;
  website?: InputMaybe<Scalars["String"]>;
};

export type UpdateCollectionOutput = {
  collection?: Maybe<Collection>;
};

export type UpdateStore = {
  store: Store;
  success: Scalars["Boolean"];
};

export type UpdateStoreCollectionsInput = {
  contracts?: InputMaybe<Array<ContractInput>>;
};

export type UpdateStoreInput = {
  backgroundColor?: InputMaybe<Scalars["String"]>;
  banner?: InputMaybe<Scalars["String"]>;
  contracts?: InputMaybe<Array<ContractInput>>;
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
  creatorSuiteProfile?: InputMaybe<CreatorSuiteProfileInput>;
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
  collectionWatchlist: CollectionsResponse;
  creatorSuiteProfile?: Maybe<CreatorSuiteProfileOutput>;
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
  stores: Array<Store>;
  twitter?: Maybe<Scalars["String"]>;
  verified?: Maybe<Scalars["Boolean"]>;
  website?: Maybe<Scalars["String"]>;
};

export type UserCollectionWatchlistArgs = {
  paging: PagingInput;
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

export type UserImportCollectionInput = {
  bannerUrl?: InputMaybe<Scalars["String"]>;
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
  description?: InputMaybe<Scalars["String"]>;
  iconUrl?: InputMaybe<Scalars["String"]>;
  name?: InputMaybe<Scalars["String"]>;
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
  platforms?: InputMaybe<Array<Platform>>;
  tokenId?: InputMaybe<Scalars["String"]>;
  type?: InputMaybe<OfferType>;
};

export enum UserRoles {
  Admin = "ADMIN",
  Moderator = "MODERATOR",
  User = "USER",
}

export type UserSortedCollection = {
  bannerUrl?: Maybe<Scalars["String"]>;
  chainIds: Array<Scalars["Float"]>;
  collectionIds: Array<Scalars["String"]>;
  creator?: Maybe<User>;
  default: Scalars["Boolean"];
  description?: Maybe<Scalars["String"]>;
  discord?: Maybe<Scalars["String"]>;
  hidden?: Maybe<Scalars["Boolean"]>;
  iconUrl?: Maybe<Scalars["String"]>;
  id: Scalars["String"];
  instagram?: Maybe<Scalars["String"]>;
  isAddedToWatchList: Scalars["Boolean"];
  isRefinableCollection: Scalars["Boolean"];
  items: ItemsWithOffersResponse;
  name?: Maybe<Scalars["String"]>;
  ownerEthAddress?: Maybe<Scalars["String"]>;
  slug: Scalars["String"];
  statistics: CollectionStatistics;
  telegram?: Maybe<Scalars["String"]>;
  tokens: Array<Token>;
  twitter?: Maybe<Scalars["String"]>;
  verified: Scalars["Boolean"];
  website?: Maybe<Scalars["String"]>;
};

export type UserSortedCollectionItemsArgs = {
  filter?: InputMaybe<CollectionMetadataFilterInput>;
  paging: PagingInput;
  sort?: InputMaybe<SortInput>;
};

export type UserSortedCollectionEdge = {
  cursor: Scalars["String"];
  node: UserSortedCollection;
};

export type UserSortedCollectionPageInfo = {
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type UserSortedCollectionsResponse = {
  edges?: Maybe<Array<UserSortedCollectionEdge>>;
  pageInfo?: Maybe<UserSortedCollectionPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

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
  limit: Scalars["Float"];
  price: Scalars["Float"];
  signature: Scalars["String"];
  startTime: Scalars["DateTime"];
  /** @deprecated No longer needed */
  whitelistType: WhitelistType;
};

export type UndefinedEdge = {
  cursor: Scalars["String"];
  node: SearchResult;
};

export type UndefinedPageInfo = {
  endCursor?: Maybe<Scalars["String"]>;
  hasNextPage: Scalars["Boolean"];
  hasPreviousPage: Scalars["Boolean"];
  startCursor?: Maybe<Scalars["String"]>;
};

export type PlaceAuctionBidMutationVariables = Exact<{
  input: AuctionPlaceBidInput;
}>;

export type PlaceAuctionBidMutation = { placeAuctionBid: boolean };

export type CreatePurchaseSessionMutationVariables = Exact<{
  input: CreatePurchaseSessionInput;
}>;

export type CreatePurchaseSessionMutation = {
  createPurchaseSession: { url: string };
};

export type CreateCollectionMutationVariables = Exact<{
  data: CreateCollectionInput;
}>;

export type CreateCollectionMutation = {
  createCollection: { id: string; slug: string };
};

export type RefinableContractQueryVariables = Exact<{
  input: GetRefinableContractInput;
}>;

export type RefinableContractQuery = {
  refinableContract?:
    | {
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
  refinableContracts: Array<{
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
  mintableCollections: Array<{
    default: boolean;
    tokens: Array<{
      contractAddress: string;
      contractABI: string;
      type: TokenType;
      chainId: number;
      tags: Array<ContractTag>;
    }>;
  }>;
};

export type GetCollectionBySlugQueryVariables = Exact<{
  slug: Scalars["String"];
}>;

export type GetCollectionBySlugQuery = {
  collection?: { slug: string } | null | undefined;
};

export type GetTokenContractQueryVariables = Exact<{
  input: FindContractInput;
}>;

export type GetTokenContractQuery = {
  contract?:
    | {
        contractAddress: string;
        contractABI: string;
        type: string;
        chainId: number;
        tags: Array<ContractTag>;
      }
    | null
    | undefined;
};

export type CreateContractMutationVariables = Exact<{
  data: CreateContractInput;
}>;

export type CreateContractMutation = {
  createContract: {
    id: string;
    contractAddress: string;
    contractABI: string;
    type: string;
    tags: Array<ContractTag>;
    chainId: number;
  };
};

export type ItemSaleInfo_MintOffer_Fragment = {
  id: string;
  createdAt?: any | null | undefined;
  chainId: number;
  type: OfferType;
  supply: number;
  price: { amount: number; currency: PriceCurrency };
  auction?:
    | {
        id: string;
        startPrice?: number | null | undefined;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        highestBid?:
          | { transactionHash: string; bidAmount: number }
          | null
          | undefined;
      }
    | null
    | undefined;
};

export type ItemSaleInfo_SaleOffer_Fragment = {
  id: string;
  createdAt?: any | null | undefined;
  chainId: number;
  type: OfferType;
  supply: number;
  price: { amount: number; currency: PriceCurrency };
  auction?:
    | {
        id: string;
        startPrice?: number | null | undefined;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        highestBid?:
          | { transactionHash: string; bidAmount: number }
          | null
          | undefined;
      }
    | null
    | undefined;
};

export type ItemSaleInfoFragment =
  | ItemSaleInfo_MintOffer_Fragment
  | ItemSaleInfo_SaleOffer_Fragment;

export type ItemInfoFragment = {
  id: string;
  tokenId: string;
  contractAddress: string;
  supply: number;
  totalSupply: number;
  name: string;
  description?: string | null | undefined;
  chainId: number;
  creator: {
    id: string;
    ethAddress?: string | null | undefined;
    name?: string | null | undefined;
    profileImage?: string | null | undefined;
    verified?: boolean | null | undefined;
  };
  collection?:
    | {
        slug: string;
        name: string;
        iconUrl?: string | null | undefined;
        verified: boolean;
      }
    | null
    | undefined;
  properties: {
    fileType: FileType;
    imagePreview?: string | null | undefined;
    fileUrl?: string | null | undefined;
    originalFileUrl?: string | null | undefined;
    thumbnailUrl?: string | null | undefined;
    originalThumbnailUrl?: string | null | undefined;
  };
  transcodings?: Array<{ url: string; mimeType: string }> | null | undefined;
};

export type GetItemsWithOfferFragment = {
  id: string;
  item: {
    id: string;
    tokenId: string;
    contractAddress: string;
    supply: number;
    totalSupply: number;
    name: string;
    description?: string | null | undefined;
    chainId: number;
    creator: {
      id: string;
      ethAddress?: string | null | undefined;
      name?: string | null | undefined;
      profileImage?: string | null | undefined;
      verified?: boolean | null | undefined;
    };
    collection?:
      | {
          slug: string;
          name: string;
          iconUrl?: string | null | undefined;
          verified: boolean;
        }
      | null
      | undefined;
    properties: {
      fileType: FileType;
      imagePreview?: string | null | undefined;
      fileUrl?: string | null | undefined;
      originalFileUrl?: string | null | undefined;
      thumbnailUrl?: string | null | undefined;
      originalThumbnailUrl?: string | null | undefined;
    };
    transcodings?: Array<{ url: string; mimeType: string }> | null | undefined;
  };
  nextEditionForSale?:
    | {
        id: string;
        createdAt?: any | null | undefined;
        chainId: number;
        type: OfferType;
        supply: number;
        price: { amount: number; currency: PriceCurrency };
        auction?:
          | {
              id: string;
              startPrice?: number | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              highestBid?:
                | { transactionHash: string; bidAmount: number }
                | null
                | undefined;
            }
          | null
          | undefined;
      }
    | {
        id: string;
        createdAt?: any | null | undefined;
        chainId: number;
        type: OfferType;
        supply: number;
        price: { amount: number; currency: PriceCurrency };
        auction?:
          | {
              id: string;
              startPrice?: number | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              highestBid?:
                | { transactionHash: string; bidAmount: number }
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
        id: string;
        createdAt?: any | null | undefined;
        chainId: number;
        type: OfferType;
        supply: number;
        price: { amount: number; currency: PriceCurrency };
        auction?:
          | {
              id: string;
              startPrice?: number | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              highestBid?:
                | { transactionHash: string; bidAmount: number }
                | null
                | undefined;
            }
          | null
          | undefined;
      }
    | {
        id: string;
        createdAt?: any | null | undefined;
        chainId: number;
        type: OfferType;
        supply: number;
        price: { amount: number; currency: PriceCurrency };
        auction?:
          | {
              id: string;
              startPrice?: number | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              highestBid?:
                | { transactionHash: string; bidAmount: number }
                | null
                | undefined;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
  creator: {
    id: string;
    ethAddress?: string | null | undefined;
    name?: string | null | undefined;
    profileImage?: string | null | undefined;
    verified?: boolean | null | undefined;
  };
  collection?:
    | {
        slug: string;
        name: string;
        iconUrl?: string | null | undefined;
        verified: boolean;
      }
    | null
    | undefined;
  properties: {
    fileType: FileType;
    imagePreview?: string | null | undefined;
    fileUrl?: string | null | undefined;
    originalFileUrl?: string | null | undefined;
    thumbnailUrl?: string | null | undefined;
    originalThumbnailUrl?: string | null | undefined;
  };
  transcodings?: Array<{ url: string; mimeType: string }> | null | undefined;
};

export type AuctionFragment = {
  id: string;
  auctionId?: string | null | undefined;
  auctionContractAddress?: string | null | undefined;
  startTime?: any | null | undefined;
  endTime?: any | null | undefined;
  startPrice?: number | null | undefined;
  bids: Array<{
    transactionHash: string;
    bidAmount: number;
    bidTime: any;
    bidder?:
      | {
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
        transactionHash: string;
        bidAmount: number;
        bidTime: any;
        bidder?:
          | {
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

export type Offer_MintOffer_Fragment = {
  id: string;
  type: OfferType;
  active: boolean;
  supply: number;
  chainId: number;
  totalSupply: number;
  startTime?: any | null | undefined;
  endTime?: any | null | undefined;
  contractAddress: string;
  signature?: string | null | undefined;
  blockchainId?: string | null | undefined;
  whitelistStage: LaunchpadCountDownType;
  user: { id: string; ethAddress?: string | null | undefined };
  price: { amount: number; currency: PriceCurrency };
  auction?:
    | {
        id: string;
        auctionId?: string | null | undefined;
        auctionContractAddress?: string | null | undefined;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        startPrice?: number | null | undefined;
        bids: Array<{
          transactionHash: string;
          bidAmount: number;
          bidTime: any;
          bidder?:
            | {
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
              transactionHash: string;
              bidAmount: number;
              bidTime: any;
              bidder?:
                | {
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
  launchpadDetails?:
    | {
        currentStage?:
          | {
              startTime?: any | null | undefined;
              stage: WhitelistType;
              price?: number | null | undefined;
              isWhitelisted: boolean;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
  marketConfig: {
    data: string;
    signature: string;
    buyServiceFeeBps?:
      | { type: ServiceFeeType; value: number }
      | null
      | undefined;
  };
  whitelistVoucher?:
    | { limit: number; signature: string; startTime: any; price: number }
    | null
    | undefined;
};

export type Offer_SaleOffer_Fragment = {
  id: string;
  type: OfferType;
  active: boolean;
  supply: number;
  chainId: number;
  totalSupply: number;
  startTime?: any | null | undefined;
  endTime?: any | null | undefined;
  contractAddress: string;
  signature?: string | null | undefined;
  blockchainId?: string | null | undefined;
  whitelistStage: LaunchpadCountDownType;
  user: { id: string; ethAddress?: string | null | undefined };
  price: { amount: number; currency: PriceCurrency };
  auction?:
    | {
        id: string;
        auctionId?: string | null | undefined;
        auctionContractAddress?: string | null | undefined;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        startPrice?: number | null | undefined;
        bids: Array<{
          transactionHash: string;
          bidAmount: number;
          bidTime: any;
          bidder?:
            | {
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
              transactionHash: string;
              bidAmount: number;
              bidTime: any;
              bidder?:
                | {
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
  launchpadDetails?:
    | {
        currentStage?:
          | {
              startTime?: any | null | undefined;
              stage: WhitelistType;
              price?: number | null | undefined;
              isWhitelisted: boolean;
            }
          | null
          | undefined;
      }
    | null
    | undefined;
  marketConfig: {
    data: string;
    signature: string;
    buyServiceFeeBps?:
      | { type: ServiceFeeType; value: number }
      | null
      | undefined;
  };
  whitelistVoucher?:
    | { limit: number; signature: string; startTime: any; price: number }
    | null
    | undefined;
};

export type OfferFragment = Offer_MintOffer_Fragment | Offer_SaleOffer_Fragment;

export type MintOfferFragment = {
  name?: string | null | undefined;
  description?: string | null | undefined;
  chainId: number;
  payee: string;
  previewFile?:
    | {
        fileUrl?: string | null | undefined;
        imagePreview?: string | null | undefined;
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
  user?:
    | {
        id: string;
        itemsOnOffer: {
          totalCount?: number | null | undefined;
          edges?:
            | Array<{
                cursor: string;
                node: {
                  id: string;
                  item: {
                    id: string;
                    tokenId: string;
                    contractAddress: string;
                    supply: number;
                    totalSupply: number;
                    name: string;
                    description?: string | null | undefined;
                    chainId: number;
                    creator: {
                      id: string;
                      ethAddress?: string | null | undefined;
                      name?: string | null | undefined;
                      profileImage?: string | null | undefined;
                      verified?: boolean | null | undefined;
                    };
                    collection?:
                      | {
                          slug: string;
                          name: string;
                          iconUrl?: string | null | undefined;
                          verified: boolean;
                        }
                      | null
                      | undefined;
                    properties: {
                      fileType: FileType;
                      imagePreview?: string | null | undefined;
                      fileUrl?: string | null | undefined;
                      originalFileUrl?: string | null | undefined;
                      thumbnailUrl?: string | null | undefined;
                      originalThumbnailUrl?: string | null | undefined;
                    };
                    transcodings?:
                      | Array<{ url: string; mimeType: string }>
                      | null
                      | undefined;
                  };
                  nextEditionForSale?:
                    | {
                        id: string;
                        createdAt?: any | null | undefined;
                        chainId: number;
                        type: OfferType;
                        supply: number;
                        price: { amount: number; currency: PriceCurrency };
                        auction?:
                          | {
                              id: string;
                              startPrice?: number | null | undefined;
                              startTime?: any | null | undefined;
                              endTime?: any | null | undefined;
                              highestBid?:
                                | { transactionHash: string; bidAmount: number }
                                | null
                                | undefined;
                            }
                          | null
                          | undefined;
                      }
                    | {
                        id: string;
                        createdAt?: any | null | undefined;
                        chainId: number;
                        type: OfferType;
                        supply: number;
                        price: { amount: number; currency: PriceCurrency };
                        auction?:
                          | {
                              id: string;
                              startPrice?: number | null | undefined;
                              startTime?: any | null | undefined;
                              endTime?: any | null | undefined;
                              highestBid?:
                                | { transactionHash: string; bidAmount: number }
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
  offer?:
    | {
        __typename: "MintOffer";
        name?: string | null | undefined;
        description?: string | null | undefined;
        chainId: number;
        payee: string;
        id: string;
        type: OfferType;
        active: boolean;
        supply: number;
        totalSupply: number;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        contractAddress: string;
        signature?: string | null | undefined;
        blockchainId?: string | null | undefined;
        whitelistStage: LaunchpadCountDownType;
        item?:
          | {
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
        previewFile?:
          | {
              fileUrl?: string | null | undefined;
              imagePreview?: string | null | undefined;
            }
          | null
          | undefined;
        user: { id: string; ethAddress?: string | null | undefined };
        price: { amount: number; currency: PriceCurrency };
        auction?:
          | {
              id: string;
              auctionId?: string | null | undefined;
              auctionContractAddress?: string | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              startPrice?: number | null | undefined;
              bids: Array<{
                transactionHash: string;
                bidAmount: number;
                bidTime: any;
                bidder?:
                  | {
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
                    transactionHash: string;
                    bidAmount: number;
                    bidTime: any;
                    bidder?:
                      | {
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
        launchpadDetails?:
          | {
              currentStage?:
                | {
                    startTime?: any | null | undefined;
                    stage: WhitelistType;
                    price?: number | null | undefined;
                    isWhitelisted: boolean;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
        marketConfig: {
          data: string;
          signature: string;
          buyServiceFeeBps?:
            | { type: ServiceFeeType; value: number }
            | null
            | undefined;
        };
        whitelistVoucher?:
          | { limit: number; signature: string; startTime: any; price: number }
          | null
          | undefined;
      }
    | {
        __typename: "SaleOffer";
        id: string;
        type: OfferType;
        active: boolean;
        supply: number;
        chainId: number;
        totalSupply: number;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        contractAddress: string;
        signature?: string | null | undefined;
        blockchainId?: string | null | undefined;
        whitelistStage: LaunchpadCountDownType;
        item?:
          | {
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
        user: { id: string; ethAddress?: string | null | undefined };
        price: { amount: number; currency: PriceCurrency };
        auction?:
          | {
              id: string;
              auctionId?: string | null | undefined;
              auctionContractAddress?: string | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              startPrice?: number | null | undefined;
              bids: Array<{
                transactionHash: string;
                bidAmount: number;
                bidTime: any;
                bidder?:
                  | {
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
                    transactionHash: string;
                    bidAmount: number;
                    bidTime: any;
                    bidder?:
                      | {
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
        launchpadDetails?:
          | {
              currentStage?:
                | {
                    startTime?: any | null | undefined;
                    stage: WhitelistType;
                    price?: number | null | undefined;
                    isWhitelisted: boolean;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
        marketConfig: {
          data: string;
          signature: string;
          buyServiceFeeBps?:
            | { type: ServiceFeeType; value: number }
            | null
            | undefined;
        };
        whitelistVoucher?:
          | { limit: number; signature: string; startTime: any; price: number }
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
  user?:
    | {
        id: string;
        items: {
          totalCount?: number | null | undefined;
          edges?:
            | Array<{
                cursor: string;
                node: {
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
                        id: string;
                        createdAt?: any | null | undefined;
                        chainId: number;
                        type: OfferType;
                        supply: number;
                        price: { amount: number; currency: PriceCurrency };
                        auction?:
                          | {
                              id: string;
                              startPrice?: number | null | undefined;
                              startTime?: any | null | undefined;
                              endTime?: any | null | undefined;
                              highestBid?:
                                | { transactionHash: string; bidAmount: number }
                                | null
                                | undefined;
                            }
                          | null
                          | undefined;
                      }
                    | {
                        id: string;
                        createdAt?: any | null | undefined;
                        chainId: number;
                        type: OfferType;
                        supply: number;
                        price: { amount: number; currency: PriceCurrency };
                        auction?:
                          | {
                              id: string;
                              startPrice?: number | null | undefined;
                              startTime?: any | null | undefined;
                              endTime?: any | null | undefined;
                              highestBid?:
                                | { transactionHash: string; bidAmount: number }
                                | null
                                | undefined;
                            }
                          | null
                          | undefined;
                      }
                    | null
                    | undefined;
                  creator: {
                    id: string;
                    ethAddress?: string | null | undefined;
                    name?: string | null | undefined;
                    profileImage?: string | null | undefined;
                    verified?: boolean | null | undefined;
                  };
                  collection?:
                    | {
                        slug: string;
                        name: string;
                        iconUrl?: string | null | undefined;
                        verified: boolean;
                      }
                    | null
                    | undefined;
                  properties: {
                    fileType: FileType;
                    imagePreview?: string | null | undefined;
                    fileUrl?: string | null | undefined;
                    originalFileUrl?: string | null | undefined;
                    thumbnailUrl?: string | null | undefined;
                    originalThumbnailUrl?: string | null | undefined;
                  };
                  transcodings?:
                    | Array<{ url: string; mimeType: string }>
                    | null
                    | undefined;
                };
              }>
            | null
            | undefined;
          pageInfo?:
            | {
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

export type RefreshMetadataMutation = { refreshMetadata: boolean };

export type UploadFileMutationVariables = Exact<{
  file: Scalars["Upload"];
}>;

export type UploadFileMutation = { uploadFile: string };

export type CreateItemMutationVariables = Exact<{
  input: CreateItemInput;
}>;

export type CreateItemMutation = {
  createItem: {
    signature?: string | null | undefined;
    item: {
      id: string;
      tokenId: string;
      contractAddress: string;
      chainId: number;
      supply: number;
      totalSupply: number;
      type: TokenType;
      properties: {
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
  finishMint: {
    item: {
      id: string;
      tokenId: string;
      contractAddress: string;
      chainId: number;
      supply: number;
      totalSupply: number;
      type: TokenType;
      properties: {
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
  createOfferForItems:
    | {
        id: string;
        type: OfferType;
        active: boolean;
        supply: number;
        chainId: number;
        totalSupply: number;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        contractAddress: string;
        signature?: string | null | undefined;
        blockchainId?: string | null | undefined;
        whitelistStage: LaunchpadCountDownType;
        user: { id: string; ethAddress?: string | null | undefined };
        price: { amount: number; currency: PriceCurrency };
        auction?:
          | {
              id: string;
              auctionId?: string | null | undefined;
              auctionContractAddress?: string | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              startPrice?: number | null | undefined;
              bids: Array<{
                transactionHash: string;
                bidAmount: number;
                bidTime: any;
                bidder?:
                  | {
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
                    transactionHash: string;
                    bidAmount: number;
                    bidTime: any;
                    bidder?:
                      | {
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
        launchpadDetails?:
          | {
              currentStage?:
                | {
                    startTime?: any | null | undefined;
                    stage: WhitelistType;
                    price?: number | null | undefined;
                    isWhitelisted: boolean;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
        marketConfig: {
          data: string;
          signature: string;
          buyServiceFeeBps?:
            | { type: ServiceFeeType; value: number }
            | null
            | undefined;
        };
        whitelistVoucher?:
          | { limit: number; signature: string; startTime: any; price: number }
          | null
          | undefined;
      }
    | {
        id: string;
        type: OfferType;
        active: boolean;
        supply: number;
        chainId: number;
        totalSupply: number;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        contractAddress: string;
        signature?: string | null | undefined;
        blockchainId?: string | null | undefined;
        whitelistStage: LaunchpadCountDownType;
        user: { id: string; ethAddress?: string | null | undefined };
        price: { amount: number; currency: PriceCurrency };
        auction?:
          | {
              id: string;
              auctionId?: string | null | undefined;
              auctionContractAddress?: string | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              startPrice?: number | null | undefined;
              bids: Array<{
                transactionHash: string;
                bidAmount: number;
                bidTime: any;
                bidder?:
                  | {
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
                    transactionHash: string;
                    bidAmount: number;
                    bidTime: any;
                    bidder?:
                      | {
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
        launchpadDetails?:
          | {
              currentStage?:
                | {
                    startTime?: any | null | undefined;
                    stage: WhitelistType;
                    price?: number | null | undefined;
                    isWhitelisted: boolean;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
        marketConfig: {
          data: string;
          signature: string;
          buyServiceFeeBps?:
            | { type: ServiceFeeType; value: number }
            | null
            | undefined;
        };
        whitelistVoucher?:
          | { limit: number; signature: string; startTime: any; price: number }
          | null
          | undefined;
      };
};

export type CreateMintOfferMutationVariables = Exact<{
  input: CreateMintOfferInput;
  storeId?: InputMaybe<Scalars["ID"]>;
}>;

export type CreateMintOfferMutation = {
  createMintOffer:
    | {
        id: string;
        type: OfferType;
        active: boolean;
        supply: number;
        chainId: number;
        totalSupply: number;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        contractAddress: string;
        signature?: string | null | undefined;
        blockchainId?: string | null | undefined;
        whitelistStage: LaunchpadCountDownType;
        name?: string | null | undefined;
        description?: string | null | undefined;
        payee: string;
        user: { id: string; ethAddress?: string | null | undefined };
        price: { amount: number; currency: PriceCurrency };
        auction?:
          | {
              id: string;
              auctionId?: string | null | undefined;
              auctionContractAddress?: string | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              startPrice?: number | null | undefined;
              bids: Array<{
                transactionHash: string;
                bidAmount: number;
                bidTime: any;
                bidder?:
                  | {
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
                    transactionHash: string;
                    bidAmount: number;
                    bidTime: any;
                    bidder?:
                      | {
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
        launchpadDetails?:
          | {
              currentStage?:
                | {
                    startTime?: any | null | undefined;
                    stage: WhitelistType;
                    price?: number | null | undefined;
                    isWhitelisted: boolean;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
        marketConfig: {
          data: string;
          signature: string;
          buyServiceFeeBps?:
            | { type: ServiceFeeType; value: number }
            | null
            | undefined;
        };
        whitelistVoucher?:
          | { limit: number; signature: string; startTime: any; price: number }
          | null
          | undefined;
        previewFile?:
          | {
              fileUrl?: string | null | undefined;
              imagePreview?: string | null | undefined;
            }
          | null
          | undefined;
      }
    | {
        id: string;
        type: OfferType;
        active: boolean;
        supply: number;
        chainId: number;
        totalSupply: number;
        startTime?: any | null | undefined;
        endTime?: any | null | undefined;
        contractAddress: string;
        signature?: string | null | undefined;
        blockchainId?: string | null | undefined;
        whitelistStage: LaunchpadCountDownType;
        user: { id: string; ethAddress?: string | null | undefined };
        price: { amount: number; currency: PriceCurrency };
        auction?:
          | {
              id: string;
              auctionId?: string | null | undefined;
              auctionContractAddress?: string | null | undefined;
              startTime?: any | null | undefined;
              endTime?: any | null | undefined;
              startPrice?: number | null | undefined;
              bids: Array<{
                transactionHash: string;
                bidAmount: number;
                bidTime: any;
                bidder?:
                  | {
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
                    transactionHash: string;
                    bidAmount: number;
                    bidTime: any;
                    bidder?:
                      | {
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
        launchpadDetails?:
          | {
              currentStage?:
                | {
                    startTime?: any | null | undefined;
                    stage: WhitelistType;
                    price?: number | null | undefined;
                    isWhitelisted: boolean;
                  }
                | null
                | undefined;
            }
          | null
          | undefined;
        marketConfig: {
          data: string;
          signature: string;
          buyServiceFeeBps?:
            | { type: ServiceFeeType; value: number }
            | null
            | undefined;
        };
        whitelistVoucher?:
          | { limit: number; signature: string; startTime: any; price: number }
          | null
          | undefined;
      };
};

export type PurchaseItemMutationVariables = Exact<{
  input: CreatePurchaseInput;
}>;

export type PurchaseItemMutation = {
  createPurchase: { transactionHash: string };
};
