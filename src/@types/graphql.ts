/* eslint-disable */
// THIS IS A GENERATED FILE, DO NOT EDIT IT!
export type Maybe<T> = T | null;
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
  id: Scalars["ID"];
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
  sort?: Maybe<SortInput>;
};

export type AuthUserItemsOnOfferArgs = {
  filter?: Maybe<UserItemOnOfferFilterInput>;
  paging: PagingInput;
  sort?: Maybe<SortInput>;
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

export type Collection = {
  __typename?: "Collection";
  bannerUrl?: Maybe<Scalars["String"]>;
  chainId: Scalars["Float"];
  collectionIds: Array<Scalars["String"]>;
  default: Scalars["Boolean"];
  description?: Maybe<Scalars["String"]>;
  discord?: Maybe<Scalars["String"]>;
  iconUrl: Scalars["String"];
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
  filter?: Maybe<CollectionMetadataFilterInput>;
  paging: PagingInput;
  sort?: Maybe<SortInput>;
};

export type CollectionEdge = {
  __typename?: "CollectionEdge";
  cursor: Scalars["String"];
  node: Collection;
};

export type CollectionMetadataFilterInput = {
  auctionType?: Maybe<AuctionType>;
  chainIds?: Maybe<Array<Scalars["String"]>>;
  collectionSlugs?: Maybe<Array<Scalars["String"]>>;
  contentType?: Maybe<ContentType>;
  currencies?: Maybe<Array<PriceCurrency>>;
  metadata: Scalars["JSON"];
  offerTypes?: Maybe<Array<OfferType>>;
  tagName?: Maybe<Scalars["String"]>;
  titleQuery?: Maybe<Scalars["String"]>;
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
  contractAddresses?: Maybe<Array<Scalars["String"]>>;
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
  /** @deprecated deprecate this to avoid breaking APIs */
  avgSellPrice?: Maybe<Scalars["Float"]>;
  /** @deprecated deprecate this to avoid breaking APIs */
  avgVolumeTraded?: Maybe<Scalars["Float"]>;
  /** @deprecated deprecate this to avoid breaking APIs */
  ceilPrice?: Maybe<Scalars["Float"]>;
  countPurchases: Scalars["Float"];
  floorPrice: Scalars["Float"];
  itemCount: Scalars["Float"];
  mainToken: Scalars["String"];
  ownerCount: Scalars["Float"];
  totalEditionsForSale: Scalars["Float"];
  totalVolumeTraded: Scalars["Float"];
};

export type CollectionsFilterInput = {
  chainIds?: Maybe<Array<Scalars["Float"]>>;
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

export type ContractCount = {
  __typename?: "ContractCount";
  minted: Scalars["Int"];
  transfered: Scalars["Int"];
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
  SaleNonceHolderV1_0_0 = "SALE_NONCE_HOLDER_v1_0_0",
  SaleV1_0_0 = "SALE_v1_0_0",
  SaleV2_0_0 = "SALE_v2_0_0",
  SaleV3_0_0 = "SALE_v3_0_0",
  SaleV3_0_1 = "SALE_v3_0_1",
  TokenV1_0_0 = "TOKEN_v1_0_0",
  TokenV2_0_0 = "TOKEN_v2_0_0",
  TokenV3_0_0 = "TOKEN_v3_0_0",
  TransferProxyV1_0_0 = "TRANSFER_PROXY_v1_0_0",
}

export enum ContractTypes {
  Erc721Airdrop = "ERC721_AIRDROP",
  Erc721Auction = "ERC721_AUCTION",
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
  TransferProxy = "TRANSFER_PROXY",
}

export type CreateEventInput = {
  events: Array<EventInput>;
};

export type CreateItemInput = {
  airdropAddresses?: Maybe<Array<Scalars["String"]>>;
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
  description?: Maybe<Scalars["String"]>;
  file: Scalars["String"];
  marketingDescription?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  royaltySettings?: Maybe<RoyaltySettingsInput>;
  supply: Scalars["Float"];
  tags?: Maybe<Array<TagInput>>;
  thumbnail?: Maybe<Scalars["String"]>;
  type: Scalars["String"];
};

export type CreateItemOutput = {
  __typename?: "CreateItemOutput";
  item: Item;
  signature?: Maybe<Scalars["String"]>;
};

export type CreateOffersInput = {
  contractAddress: Scalars["String"];
  endTime?: Maybe<Scalars["DateTime"]>;
  offerContractAddress?: Maybe<Scalars["String"]>;
  price?: Maybe<PriceInput>;
  signature?: Maybe<Scalars["String"]>;
  startTime?: Maybe<Scalars["DateTime"]>;
  supply: Scalars["Float"];
  tokenId: Scalars["String"];
  transactionHash?: Maybe<Scalars["String"]>;
  type: Scalars["String"];
};

export type CreatePurchaseInput = {
  amount: Scalars["Int"];
  offerId: Scalars["String"];
  transactionHash: Scalars["String"];
};

export type CreateStoreInput = {
  backgroundColor: Scalars["String"];
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
  description: Scalars["String"];
  discord?: Maybe<Scalars["String"]>;
  domain: Scalars["String"];
  email: Scalars["String"];
  favicon: Scalars["String"];
  instagram?: Maybe<Scalars["String"]>;
  logo: Scalars["String"];
  name: Scalars["String"];
  primaryColor: Scalars["String"];
  telegram?: Maybe<Scalars["String"]>;
  twitter?: Maybe<Scalars["String"]>;
  website?: Maybe<Scalars["String"]>;
};

export type EventInput = {
  assetId: Scalars["ID"];
  assetType: AssetType;
  type: EventType;
};

export enum EventType {
  View = "VIEW",
}

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

export type GetRefinableContractInput = {
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
};

export type GetRefinableContractsInput = {
  chainId?: Maybe<Scalars["Float"]>;
  tags?: Maybe<Array<ContractTag>>;
  types?: Maybe<Array<ContractTypes>>;
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
  limit?: Maybe<Scalars["Int"]>;
};

export type ImportCollectionInput = {
  chainId: Scalars["Float"];
  contractABI?: Maybe<Scalars["String"]>;
  contractAddress: Scalars["String"];
  description: Scalars["String"];
  iconUrl: Scalars["String"];
  metadataUrlTemplate?: Maybe<Scalars["String"]>;
  name: Scalars["String"];
  slug: Scalars["String"];
  type?: Maybe<TokenType>;
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
  tags?: Maybe<Array<TagInput>>;
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
  marketingDescription?: Maybe<Scalars["String"]>;
  name: Scalars["String"];
  nextEditionForSale?: Maybe<Offer>;
  owners: Array<ItemOwner>;
  properties: Properties;
  reason?: Maybe<Scalars["String"]>;
  similarItems: Array<ItemWithOffer>;
  supply: Scalars["Float"];
  tags: Array<Tag>;
  tokenId: Scalars["String"];
  totalSupply: Scalars["Int"];
  transactionHash: Scalars["String"];
  transcodings?: Maybe<Array<Transcoding>>;
  type: TokenType;
  userSupply: Scalars["Int"];
};

export type ItemAvailableUserSupplyArgs = {
  ethAddress?: Maybe<Scalars["String"]>;
};

export type ItemHistoryArgs = {
  paging: PagingInput;
};

export type ItemNextEditionForSaleArgs = {
  ethAddress?: Maybe<Scalars["String"]>;
};

export type ItemSimilarItemsArgs = {
  limit: Scalars["Int"];
};

export type ItemUserSupplyArgs = {
  ethAddress?: Maybe<Scalars["String"]>;
};

export type ItemAttribute = {
  __typename?: "ItemAttribute";
  displayType?: Maybe<Scalars["String"]>;
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
  active?: Maybe<Scalars["Boolean"]>;
  reason?: Maybe<ItemReportReason>;
};

export type ItemReportInput = {
  comment?: Maybe<Scalars["String"]>;
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
  auctionType?: Maybe<AuctionType>;
  chainIds?: Maybe<Array<Scalars["String"]>>;
  collectionSlugs?: Maybe<Array<Scalars["String"]>>;
  contentType?: Maybe<ContentType>;
  currencies?: Maybe<Array<PriceCurrency>>;
  offerTypes?: Maybe<Array<OfferType>>;
  tagName?: Maybe<Scalars["String"]>;
  titleQuery?: Maybe<Scalars["String"]>;
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

export type LoginInput = {
  chainId?: Maybe<Scalars["Float"]>;
  ethAddress: Scalars["String"];
  signature: Scalars["String"];
  type?: Maybe<UserType>;
  walletType?: Maybe<Scalars["String"]>;
};

export type MetadataValuePossibility = {
  __typename?: "MetadataValuePossibility";
  count: Scalars["Float"];
  value?: Maybe<Scalars["String"]>;
};

export type Mutation = {
  __typename?: "Mutation";
  createEvent: Scalars["Boolean"];
  createItem: CreateItemOutput;
  createOfferForItems: Offer;
  createPurchase: Purchase;
  createStore: Store;
  dismissReport: ItemReport;
  finishMint: FinishMintOutput;
  generateVerificationToken: Scalars["Int"];
  hideItem: Item;
  importCollection: ImportCollectionOutput;
  importItem: CreateItemOutput;
  login: Auth;
  placeAuctionBid: Scalars["Boolean"];
  reportItem: ItemReport;
  updateUser: User;
  uploadFile: Scalars["String"];
};

export type MutationCreateEventArgs = {
  input: CreateEventInput;
};

export type MutationCreateItemArgs = {
  input: CreateItemInput;
};

export type MutationCreateOfferForItemsArgs = {
  input: CreateOffersInput;
};

export type MutationCreatePurchaseArgs = {
  input: CreatePurchaseInput;
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

export type MutationLoginArgs = {
  data: LoginInput;
};

export type MutationPlaceAuctionBidArgs = {
  input: AuctionPlaceBidInput;
};

export type MutationReportItemArgs = {
  input: ItemReportInput;
};

export type MutationUpdateUserArgs = {
  data: UpdateUserInput;
};

export type MutationUploadFileArgs = {
  file: Scalars["Upload"];
};

export type Offer = {
  __typename?: "Offer";
  active: Scalars["Boolean"];
  auction?: Maybe<Auction>;
  createdAt?: Maybe<Scalars["DateTime"]>;
  id: Scalars["String"];
  price: Price;
  signature?: Maybe<Scalars["String"]>;
  supply: Scalars["Int"];
  totalSupply: Scalars["Int"];
  type: OfferType;
  unlistedAt?: Maybe<Scalars["DateTime"]>;
  user: User;
};

export enum OfferType {
  Auction = "AUCTION",
  Sale = "SALE",
}

export type PagingInput = {
  /** Paginate after opaque cursor */
  after?: Maybe<Scalars["String"]>;
  /** Paginate before opaque cursor */
  before?: Maybe<Scalars["String"]>;
  /** Paginate first */
  first?: Maybe<Scalars["Float"]>;
  /** Paginate last */
  last?: Maybe<Scalars["Float"]>;
};

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
  originalFileUrl?: Maybe<Scalars["String"]>;
  originalThumbnailUrl?: Maybe<Scalars["String"]>;
  thumbnailUrl?: Maybe<Scalars["String"]>;
};

export type Purchase = {
  __typename?: "Purchase";
  transactionHash: Scalars["String"];
};

export type Query = {
  __typename?: "Query";
  auction?: Maybe<Auction>;
  brands: Array<Brand>;
  collection?: Maybe<Collection>;
  collectionMetadataValues: Array<CollectionMetadataValues>;
  collections: CollectionsResponse;
  contractCount: ContractCount;
  getUploadUrl: GetUploadUrlOutput;
  hotCollections: CollectionsResponse;
  hotItems: HotItemsResponse;
  hottestTags: Array<Tag>;
  importPreview: ImportItemPreview;
  item?: Maybe<Item>;
  itemsOnOffer: ItemsWithOffersResponse;
  me: User;
  mintableCollections: Array<Collection>;
  offer?: Maybe<Offer>;
  refinableContract?: Maybe<ContractOutput>;
  refinableContracts: Array<ContractOutput>;
  reports: ItemReportResponse;
  search: SearchResponse;
  searchTag: Array<Tag>;
  store?: Maybe<Store>;
  /** @deprecated tag creation limit is not supported anymore */
  tagCreationUserSuspended: TagSuspensionOutput;
  topUsers: Array<TopUser>;
  user?: Maybe<User>;
};

export type QueryAuctionArgs = {
  id?: Maybe<Scalars["ID"]>;
};

export type QueryCollectionArgs = {
  slug: Scalars["String"];
};

export type QueryCollectionMetadataValuesArgs = {
  input: CollectionMetadataValuesInput;
};

export type QueryCollectionsArgs = {
  filter?: Maybe<CollectionsFilterInput>;
  paging: PagingInput;
  sort?: Maybe<SortInput>;
};

export type QueryContractCountArgs = {
  chainId: Scalars["Int"];
  contractAddress: Scalars["String"];
};

export type QueryGetUploadUrlArgs = {
  contentType: Scalars["String"];
  fileName: Scalars["String"];
  type: UploadType;
};

export type QueryHotItemsArgs = {
  limit?: Maybe<Scalars["Int"]>;
  type: AssetType;
};

export type QueryHottestTagsArgs = {
  filter: HottestTagsFilterInput;
};

export type QueryImportPreviewArgs = {
  input: ImportItemPreviewInput;
};

export type QueryItemArgs = {
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
};

export type QueryItemsOnOfferArgs = {
  filter?: Maybe<ItemsFilterInput>;
  paging: PagingInput;
  sort?: Maybe<SortInput>;
};

export type QueryOfferArgs = {
  id?: Maybe<Scalars["ID"]>;
};

export type QueryRefinableContractArgs = {
  input: GetRefinableContractInput;
};

export type QueryRefinableContractsArgs = {
  input: GetRefinableContractsInput;
};

export type QueryReportsArgs = {
  filter?: Maybe<ItemReportFilterInput>;
  paging: PagingInput;
  sort?: Maybe<SortInput>;
};

export type QuerySearchArgs = {
  limit?: Maybe<Scalars["Int"]>;
  query?: Maybe<Scalars["String"]>;
  type: AssetType;
};

export type QuerySearchTagArgs = {
  limit?: Maybe<Scalars["Int"]>;
  query: Scalars["String"];
};

export type QueryStoreArgs = {
  domain: Scalars["String"];
};

export type QueryTopUsersArgs = {
  limit?: Maybe<Scalars["Int"]>;
};

export type QueryUserArgs = {
  ethAddress: Scalars["String"];
};

export type RoyaltiesInput = {
  recipient: Scalars["String"];
  value: Scalars["Int"];
};

export type RoyaltySettingsInput = {
  royaltyBps?: Maybe<Scalars["Float"]>;
  royaltyStrategy: RoyaltyStrategy;
  shares?: Maybe<Array<RoyaltiesInput>>;
};

export enum RoyaltyStrategy {
  ProfitDistributionStrategy = "PROFIT_DISTRIBUTION_STRATEGY",
  StandardRoyaltyStrategy = "STANDARD_ROYALTY_STRATEGY",
}

export type SearchResponse = {
  __typename?: "SearchResponse";
  result: Array<SearchResult>;
};

export type SearchResult = Collection | ItemWithOffer | Tag | User;

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
  chainId: Scalars["Float"];
  contractAddress: Scalars["String"];
  creator: Scalars["String"];
  description: Scalars["String"];
  discord: Scalars["String"];
  domain: Scalars["String"];
  email: Scalars["String"];
  favicon: Scalars["String"];
  instagram: Scalars["String"];
  logo: Scalars["String"];
  name: Scalars["String"];
  primaryColor: Scalars["String"];
  telegram: Scalars["String"];
  twitter: Scalars["String"];
  website: Scalars["String"];
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

export type UpdateUserInput = {
  description?: Maybe<Scalars["String"]>;
  email?: Maybe<Scalars["String"]>;
  instagram?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  profileBanner?: Maybe<Scalars["String"]>;
  profileImage?: Maybe<Scalars["String"]>;
  twitter?: Maybe<Scalars["String"]>;
  website?: Maybe<Scalars["String"]>;
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
  sort?: Maybe<SortInput>;
};

export type UserItemsOnOfferArgs = {
  filter?: Maybe<UserItemOnOfferFilterInput>;
  paging: PagingInput;
  sort?: Maybe<SortInput>;
};

export type UserItemFilterInput = {
  type: UserItemFilterType;
};

export enum UserItemFilterType {
  Created = "CREATED",
  Owned = "OWNED",
}

export type UserItemOnOfferFilterInput = {
  type?: Maybe<OfferType>;
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
  type?: Maybe<UserType>;
};

export type PlaceAuctionBidMutationVariables = Exact<{
  input: AuctionPlaceBidInput;
}>;

export type PlaceAuctionBidMutation = {
  __typename?: "Mutation";
  placeAuctionBid: boolean;
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
  signature?: string | null | undefined;
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
};

export type GetUserOfferItemsQueryVariables = Exact<{
  ethAddress: Scalars["String"];
  filter?: Maybe<UserItemOnOfferFilterInput>;
  paging: PagingInput;
  sort?: Maybe<SortInput>;
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
  input: CreateOffersInput;
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
    signature?: string | null | undefined;
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
  };
};

export type PurchaseItemMutationVariables = Exact<{
  input: CreatePurchaseInput;
}>;

export type PurchaseItemMutation = {
  __typename?: "Mutation";
  createPurchase: { __typename?: "Purchase"; transactionHash: string };
};
