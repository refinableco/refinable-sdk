/* eslint-disable */
// THIS IS A GENERATED FILE, DO NOT EDIT IT!
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };
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
  Item = "ITEM",
  User = "USER",
  Collection = "COLLECTION",
  Tag = "TAG",
}

export type Auction = {
  __typename?: "Auction";
  bids: Array<Bid>;
  startTime?: Maybe<Scalars["DateTime"]>;
  endTime?: Maybe<Scalars["DateTime"]>;
  tokenId?: Maybe<Scalars["String"]>;
  startPrice?: Maybe<Scalars["Float"]>;
  transactionHash?: Maybe<Scalars["String"]>;
  transaction?: Maybe<Transaction>;
  auctionId?: Maybe<Scalars["String"]>;
  verified?: Maybe<Scalars["Boolean"]>;
  id: Scalars["ID"];
  verifiedAt?: Maybe<Scalars["DateTime"]>;
  highestBid?: Maybe<Bid>;
  owner: User;
  auctionContractAddress?: Maybe<Scalars["String"]>;
};

export type AuctionPlaceBidInput = {
  transactionHash: Scalars["String"];
  bidAmount: Scalars["Float"];
  auctionId: Scalars["String"];
};

export enum AuctionType {
  OnGoing = "ON_GOING",
  Upcoming = "UPCOMING",
  Closed = "CLOSED",
  ClosingSoon = "CLOSING_SOON",
  OpenTopBids = "OPEN_TOP_BIDS",
}

export type Auth = {
  __typename?: "Auth";
  /** JWT Bearer token */
  token: Scalars["String"];
  user: AuthUser;
};

export type AuthUser = {
  __typename?: "AuthUser";
  id: Scalars["String"];
  name?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  ethAddress?: Maybe<Scalars["String"]>;
  twitter?: Maybe<Scalars["String"]>;
  instagram?: Maybe<Scalars["String"]>;
  website?: Maybe<Scalars["String"]>;
  profileImage?: Maybe<Scalars["String"]>;
  profileBanner?: Maybe<Scalars["String"]>;
  verified?: Maybe<Scalars["Boolean"]>;
  fineHolderBenefits?: Maybe<FineHolderBenefits>;
  receivedComRewards: Scalars["Float"];
  roles?: Maybe<Array<UserRoles>>;
  items: ItemsResponse;
  itemsOnOffer: ItemsWithOffersResponse;
  email: Scalars["String"];
};

export type AuthUserItemsArgs = {
  sort?: Maybe<SortInput>;
  filter?: Maybe<UserItemFilterInput>;
  paging: PagingInput;
};

export type AuthUserItemsOnOfferArgs = {
  sort?: Maybe<SortInput>;
  filter?: Maybe<UserItemOnOfferFilterInput>;
  paging: PagingInput;
};

export type Bid = {
  __typename?: "Bid";
  bidAmount: Scalars["Float"];
  bidTime: Scalars["DateTime"];
  verified?: Maybe<Scalars["Boolean"]>;
  verifiedAt?: Maybe<Scalars["DateTime"]>;
  transactionHash: Scalars["String"];
  bidder?: Maybe<User>;
};

export type Brand = {
  __typename?: "Brand";
  id: Scalars["String"];
  name: Scalars["String"];
  description: Scalars["String"];
  fileUrl: Scalars["String"];
  link: Scalars["String"];
};

export type Collection = {
  __typename?: "Collection";
  name: Scalars["String"];
  iconUrl: Scalars["String"];
  default: Scalars["Boolean"];
  description?: Maybe<Scalars["String"]>;
  slug: Scalars["String"];
  tokens: Array<Token>;
  telegram?: Maybe<Scalars["String"]>;
  twitter?: Maybe<Scalars["String"]>;
  discord?: Maybe<Scalars["String"]>;
  website?: Maybe<Scalars["String"]>;
  bannerUrl?: Maybe<Scalars["String"]>;
  instagram?: Maybe<Scalars["String"]>;
  verified: Scalars["Boolean"];
  items: ItemsWithOffersResponse;
};

export type CollectionItemsArgs = {
  sort?: Maybe<SortInput>;
  filter?: Maybe<CollectionItemFilterInput>;
  paging: PagingInput;
};

export type CollectionItemFilterInput = {
  type?: Maybe<ItemWithOfferFilterType>;
};

export enum ContentType {
  VerifiedContent = "VERIFIED_CONTENT",
  CommunityContent = "COMMUNITY_CONTENT",
}

export type ContractOutput = {
  __typename?: "ContractOutput";
  contractAddress: Scalars["String"];
  contractABI: Scalars["String"];
  type: Scalars["String"];
};

export enum ContractTypes {
  Erc721Token = "ERC721_TOKEN",
  Erc1155Token = "ERC1155_TOKEN",
  Erc721Sale = "ERC721_SALE",
  Erc1155Sale = "ERC1155_SALE",
  Erc721Auction = "ERC721_AUCTION",
  Erc1155Auction = "ERC1155_AUCTION",
  Erc721SaleNonceHolder = "ERC721_SALE_NONCE_HOLDER",
  Erc1155SaleNonceHolder = "ERC1155_SALE_NONCE_HOLDER",
  Erc1155Airdrop = "ERC1155_AIRDROP",
  Erc721WhitelistedToken = "ERC721_WHITELISTED_TOKEN",
  Erc1155WhitelistedToken = "ERC1155_WHITELISTED_TOKEN",
  TransferProxy = "TRANSFER_PROXY",
}

export type CreateEventInput = {
  events: Array<EventInput>;
};

export type CreateItemInput = {
  description?: Maybe<Scalars["String"]>;
  marketingDescription?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  thumbnail?: Maybe<Scalars["String"]>;
  file: Scalars["String"];
  type: Scalars["String"];
  supply: Scalars["Float"];
  chainId?: Maybe<Scalars["Float"]>;
  contractAddress: Scalars["String"];
  royaltySettings?: Maybe<RoyaltySettingsInput>;
  tags?: Maybe<Array<TagInput>>;
  airdropAddresses?: Maybe<Array<Scalars["String"]>>;
};

export type CreateItemOutput = {
  __typename?: "CreateItemOutput";
  item: Item;
  signature?: Maybe<Scalars["String"]>;
};

export type CreateOffersInput = {
  tokenId: Scalars["String"];
  signature?: Maybe<Scalars["String"]>;
  transactionHash?: Maybe<Scalars["String"]>;
  type: Scalars["String"];
  contractAddress: Scalars["String"];
  price?: Maybe<PriceInput>;
  supply: Scalars["Float"];
  startTime?: Maybe<Scalars["DateTime"]>;
  endTime?: Maybe<Scalars["DateTime"]>;
  offerContractAddress?: Maybe<Scalars["String"]>;
};

export type CreatePurchaseInput = {
  transactionHash: Scalars["String"];
  offerId: Scalars["String"];
  amount: Scalars["Int"];
};

export type EventInput = {
  type: EventType;
  assetType: AssetType;
  assetId: Scalars["ID"];
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
  userBenefitLevel?: Maybe<Scalars["String"]>;
  mintAllowance?: Maybe<Scalars["Float"]>;
  taggingLimit?: Maybe<Scalars["Float"]>;
  rarityLimit?: Maybe<Scalars["Float"]>;
  royaltyLimit?: Maybe<Scalars["Float"]>;
  auctionAllowance?: Maybe<Scalars["Float"]>;
  avgFineTokenBalance?: Maybe<Scalars["Float"]>;
};

export type FinishMintInput = {
  transactionHash: Scalars["String"];
  tokenId: Scalars["String"];
  contractAddress: Scalars["String"];
};

export type FinishMintOutput = {
  __typename?: "FinishMintOutput";
  item: Item;
};

export type GetRefinableContractsInput = {
  types: Array<ContractTypes>;
  chainId: Scalars["Float"];
};

export type GetUploadUrlOutput = {
  __typename?: "GetUploadUrlOutput";
  url: Scalars["String"];
  fields: Scalars["JSON"];
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
  contractAddress: Scalars["String"];
  userId: Scalars["String"];
  name: Scalars["String"];
  slug: Scalars["String"];
  chainId?: Maybe<Scalars["Float"]>;
  contractABI: Scalars["String"];
  metadataUrlTemplate?: Maybe<Scalars["String"]>;
  iconUrl: Scalars["String"];
  description: Scalars["String"];
  type: TokenType;
};

export type ImportItemInput = {
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
  chainId: Scalars["Int"];
  apiUrl: Scalars["String"];
  tags?: Maybe<Array<TagInput>>;
};

export type ImportItemPreview = {
  __typename?: "ImportItemPreview";
  name: Scalars["String"];
  description: Scalars["String"];
  file: Scalars["String"];
  apiUrlFound?: Maybe<Scalars["Boolean"]>;
  apiUrl?: Maybe<Scalars["String"]>;
};

export type ImportItemPreviewInput = {
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
  apiUrl: Scalars["String"];
};

export type Item = {
  __typename?: "Item";
  id: Scalars["String"];
  tokenId: Scalars["String"];
  createdAt: Scalars["DateTime"];
  properties: Properties;
  transactionHash: Scalars["String"];
  contractAddress: Scalars["String"];
  owners: Array<ItemOwner>;
  type: TokenType;
  name: Scalars["String"];
  description?: Maybe<Scalars["String"]>;
  marketingDescription?: Maybe<Scalars["String"]>;
  tags: Array<Tag>;
  supply: Scalars["Float"];
  chainId: Scalars["Float"];
  reason?: Maybe<Scalars["String"]>;
  userSupply: Scalars["Int"];
  availableUserSupply: Scalars["Int"];
  editionsForSale: Array<Offer>;
  nextEditionForSale?: Maybe<Offer>;
  creator: User;
  history: ItemHistoryResponse;
  transcodings?: Maybe<Array<Transcoding>>;
  collection?: Maybe<Collection>;
  attributes?: Maybe<Array<ItemAttribute>>;
};

export type ItemUserSupplyArgs = {
  ethAddress?: Maybe<Scalars["String"]>;
};

export type ItemAvailableUserSupplyArgs = {
  ethAddress?: Maybe<Scalars["String"]>;
};

export type ItemNextEditionForSaleArgs = {
  ethAddress?: Maybe<Scalars["String"]>;
};

export type ItemHistoryArgs = {
  paging: PagingInput;
};

export type ItemAttribute = {
  __typename?: "ItemAttribute";
  value: Scalars["String"];
  traitType?: Maybe<Scalars["String"]>;
  displayType?: Maybe<Scalars["String"]>;
};

export type ItemEdge = {
  __typename?: "ItemEdge";
  cursor: Scalars["String"];
  node: Item;
};

export type ItemHistory = {
  __typename?: "ItemHistory";
  id: Scalars["String"];
  createdAt?: Maybe<Scalars["DateTime"]>;
  type?: Maybe<ItemHistoryType>;
  from?: Maybe<User>;
  to?: Maybe<User>;
  transactionHash?: Maybe<Scalars["String"]>;
  /** @deprecated As we are supporting multiple chains, the frontend will have the correct explorerUri */
  externalTxUrl?: Maybe<Scalars["String"]>;
};

export type ItemHistoryEdge = {
  __typename?: "ItemHistoryEdge";
  cursor: Scalars["String"];
  node: ItemHistory;
};

export type ItemHistoryPageInfo = {
  __typename?: "ItemHistoryPageInfo";
  startCursor?: Maybe<Scalars["String"]>;
  endCursor?: Maybe<Scalars["String"]>;
  hasPreviousPage: Scalars["Boolean"];
  hasNextPage: Scalars["Boolean"];
};

export type ItemHistoryResponse = {
  __typename?: "ItemHistoryResponse";
  edges?: Maybe<Array<ItemHistoryEdge>>;
  pageInfo?: Maybe<ItemHistoryPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export enum ItemHistoryType {
  Minted = "MINTED",
  SaleCreated = "SALE_CREATED",
  Purchase = "PURCHASE",
  Transfer = "TRANSFER",
  AuctionCreated = "AUCTION_CREATED",
  AuctionCancelled = "AUCTION_CANCELLED",
  AuctionClosed = "AUCTION_CLOSED",
  Airdrop = "AIRDROP",
  Burn = "BURN",
  SaleClosed = "SALE_CLOSED",
}

export type ItemMinted = {
  __typename?: "ItemMinted";
  tokenId: Scalars["String"];
  transactionHash: Scalars["String"];
  contractAddress: Scalars["String"];
  ethAddress: Scalars["String"];
};

export type ItemOwner = {
  __typename?: "ItemOwner";
  ethAddress: Scalars["String"];
  supply: Scalars["Float"];
  name?: Maybe<Scalars["String"]>;
  profileImage?: Maybe<Scalars["String"]>;
  verified?: Maybe<Scalars["Boolean"]>;
};

export type ItemPageInfo = {
  __typename?: "ItemPageInfo";
  startCursor?: Maybe<Scalars["String"]>;
  endCursor?: Maybe<Scalars["String"]>;
  hasPreviousPage: Scalars["Boolean"];
  hasNextPage: Scalars["Boolean"];
};

export type ItemReport = {
  __typename?: "ItemReport";
  id: Scalars["String"];
  reason: ItemReportReason;
  comment?: Maybe<Scalars["String"]>;
  reportedAt: Scalars["DateTime"];
  reporter?: Maybe<User>;
  handledBy?: Maybe<User>;
  item?: Maybe<Item>;
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
  itemId: Scalars["String"];
  reason: ItemReportReason;
  comment?: Maybe<Scalars["String"]>;
};

export type ItemReportPageInfo = {
  __typename?: "ItemReportPageInfo";
  startCursor?: Maybe<Scalars["String"]>;
  endCursor?: Maybe<Scalars["String"]>;
  hasPreviousPage: Scalars["Boolean"];
  hasNextPage: Scalars["Boolean"];
};

export enum ItemReportReason {
  NoReason = "NO_REASON",
  Nsfw = "NSFW",
  CopyrightViolation = "COPYRIGHT_VIOLATION",
}

export type ItemReportResponse = {
  __typename?: "ItemReportResponse";
  edges?: Maybe<Array<ItemReportEdge>>;
  pageInfo?: Maybe<ItemReportPageInfo>;
  totalCount?: Maybe<Scalars["Float"]>;
};

export type ItemWithOffer = {
  __typename?: "ItemWithOffer";
  id: Scalars["String"];
  item: Item;
  cheapestEditionForSale?: Maybe<Offer>;
  editionsForSale: Array<Offer>;
  nextEditionForSale?: Maybe<Offer>;
  /** @deprecated Not used */
  availableSupply?: Maybe<Scalars["Int"]>;
};

export type ItemWithOfferEdge = {
  __typename?: "ItemWithOfferEdge";
  cursor: Scalars["String"];
  node: ItemWithOffer;
};

export enum ItemWithOfferFilterType {
  OnSale = "OnSale",
}

export type ItemWithOfferPageInfo = {
  __typename?: "ItemWithOfferPageInfo";
  startCursor?: Maybe<Scalars["String"]>;
  endCursor?: Maybe<Scalars["String"]>;
  hasPreviousPage: Scalars["Boolean"];
  hasNextPage: Scalars["Boolean"];
};

export type ItemsFilterInput = {
  collection?: Maybe<Scalars["String"]>;
  tagName?: Maybe<Scalars["String"]>;
  auctionType?: Maybe<AuctionType>;
  chainIds?: Maybe<Array<Scalars["String"]>>;
  contentType?: Maybe<ContentType>;
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
  ethAddress: Scalars["String"];
  signature: Scalars["String"];
};

export type Mutation = {
  __typename?: "Mutation";
  createItem: CreateItemOutput;
  importItem: CreateItemOutput;
  hideItem: Item;
  importCollection: Scalars["Boolean"];
  finishMint: FinishMintOutput;
  createPurchase: Purchase;
  createOfferForItems: Offer;
  placeAuctionBid: Scalars["Boolean"];
  updateUser: User;
  uploadFile: Scalars["String"];
  createEvent: Scalars["Boolean"];
  login: Auth;
  reportItem: ItemReport;
  dismissReport: ItemReport;
};

export type MutationCreateItemArgs = {
  input: CreateItemInput;
};

export type MutationImportItemArgs = {
  input: ImportItemInput;
};

export type MutationHideItemArgs = {
  input: HideItemInput;
};

export type MutationImportCollectionArgs = {
  input: ImportCollectionInput;
};

export type MutationFinishMintArgs = {
  input: FinishMintInput;
};

export type MutationCreatePurchaseArgs = {
  input: CreatePurchaseInput;
};

export type MutationCreateOfferForItemsArgs = {
  input: CreateOffersInput;
};

export type MutationPlaceAuctionBidArgs = {
  input: AuctionPlaceBidInput;
};

export type MutationUpdateUserArgs = {
  data: UpdateUserInput;
};

export type MutationUploadFileArgs = {
  file: Scalars["Upload"];
};

export type MutationCreateEventArgs = {
  input: CreateEventInput;
};

export type MutationLoginArgs = {
  data: LoginInput;
};

export type MutationReportItemArgs = {
  input: ItemReportInput;
};

export type MutationDismissReportArgs = {
  input: Scalars["String"];
};

export type Offer = {
  __typename?: "Offer";
  id: Scalars["String"];
  active: Scalars["Boolean"];
  price: Price;
  type?: Maybe<Scalars["String"]>;
  signature?: Maybe<Scalars["String"]>;
  createdAt?: Maybe<Scalars["DateTime"]>;
  unlistedAt?: Maybe<Scalars["DateTime"]>;
  supply: Scalars["Int"];
  totalSupply: Scalars["Int"];
  auction?: Maybe<Auction>;
  user: User;
};

export enum OfferType {
  Sale = "SALE",
  Auction = "AUCTION",
}

export type PagingInput = {
  /** Paginate before opaque cursor */
  before?: Maybe<Scalars["String"]>;
  /** Paginate after opaque cursor */
  after?: Maybe<Scalars["String"]>;
  /** Paginate first */
  first?: Maybe<Scalars["Float"]>;
  /** Paginate last */
  last?: Maybe<Scalars["Float"]>;
};

export type Price = {
  __typename?: "Price";
  currency: PriceCurrency;
  amount: Scalars["Float"];
};

export enum PriceCurrency {
  Bnb = "BNB",
  Usdt = "USDT",
  Matic = "MATIC",
  Weth = "WETH",
  Busd = "BUSD",
  Eth = "ETH",
}

export type PriceInput = {
  amount: Scalars["Float"];
  currency: PriceCurrency;
};

export type Properties = {
  __typename?: "Properties";
  fileType: FileType;
  fileKey?: Maybe<Scalars["String"]>;
  imagePreview?: Maybe<Scalars["String"]>;
  fileUrl?: Maybe<Scalars["String"]>;
  originalFileUrl?: Maybe<Scalars["String"]>;
  thumbnailUrl?: Maybe<Scalars["String"]>;
  originalThumbnailUrl?: Maybe<Scalars["String"]>;
  ipfsDocument?: Maybe<Scalars["String"]>;
  ipfsUrl?: Maybe<Scalars["String"]>;
};

export type Purchase = {
  __typename?: "Purchase";
  transactionHash: Scalars["String"];
};

export type Query = {
  __typename?: "Query";
  refinableContracts: Array<ContractOutput>;
  importPreview: ImportItemPreview;
  item?: Maybe<Item>;
  collections: Array<Collection>;
  mintableCollections: Array<Collection>;
  collection?: Maybe<Collection>;
  offer?: Maybe<Offer>;
  itemsOnOffer: ItemsWithOffersResponse;
  auction?: Maybe<Auction>;
  user?: Maybe<User>;
  /** @deprecated User consent is beeing given directly on the frontend */
  userConsent: UserConsent;
  me: User;
  getUploadUrl: GetUploadUrlOutput;
  hottestTags: Array<Tag>;
  searchTag: Array<Tag>;
  /** @deprecated tag creation limit is not supported anymore */
  tagCreationUserSuspended: TagSuspensionOutput;
  hotItems: HotItemsResponse;
  topUsers: Array<TopUser>;
  verificationToken: Scalars["Int"];
  search: SearchResponse;
  brands: Array<Brand>;
  reports: ItemReportResponse;
};

export type QueryRefinableContractsArgs = {
  input: GetRefinableContractsInput;
};

export type QueryImportPreviewArgs = {
  input: ImportItemPreviewInput;
};

export type QueryItemArgs = {
  tokenId: Scalars["String"];
  contractAddress: Scalars["String"];
};

export type QueryCollectionArgs = {
  slug: Scalars["String"];
};

export type QueryOfferArgs = {
  id?: Maybe<Scalars["ID"]>;
};

export type QueryItemsOnOfferArgs = {
  sort?: Maybe<SortInput>;
  filter?: Maybe<ItemsFilterInput>;
  paging: PagingInput;
};

export type QueryAuctionArgs = {
  id?: Maybe<Scalars["ID"]>;
};

export type QueryUserArgs = {
  ethAddress: Scalars["String"];
};

export type QueryGetUploadUrlArgs = {
  contentType: Scalars["String"];
  fileName: Scalars["String"];
  type: UploadType;
};

export type QueryHottestTagsArgs = {
  filter: HottestTagsFilterInput;
};

export type QuerySearchTagArgs = {
  limit?: Maybe<Scalars["Int"]>;
  query: Scalars["String"];
};

export type QueryHotItemsArgs = {
  limit?: Maybe<Scalars["Int"]>;
  type: AssetType;
};

export type QueryTopUsersArgs = {
  limit?: Maybe<Scalars["Int"]>;
};

export type QueryVerificationTokenArgs = {
  data: VerificationTokenInput;
};

export type QuerySearchArgs = {
  limit?: Maybe<Scalars["Int"]>;
  query?: Maybe<Scalars["String"]>;
  type: AssetType;
};

export type QueryReportsArgs = {
  sort?: Maybe<SortInput>;
  filter?: Maybe<ItemReportFilterInput>;
  paging: PagingInput;
};

export type RoyaltiesInput = {
  value: Scalars["Int"];
  recipient: Scalars["String"];
};

export type RoyaltySettingsInput = {
  shares?: Maybe<Array<RoyaltiesInput>>;
  royaltyStrategy: RoyaltyStrategy;
  royaltyBps?: Maybe<Scalars["Float"]>;
};

export enum RoyaltyStrategy {
  StandardRoyaltyStrategy = "STANDARD_ROYALTY_STRATEGY",
  ProfitDistributionStrategy = "PROFIT_DISTRIBUTION_STRATEGY",
}

export type SearchResponse = {
  __typename?: "SearchResponse";
  result: Array<SearchResult>;
};

export type SearchResult = ItemWithOffer | User | Tag | Collection;

export type SortInput = {
  field: Scalars["String"];
  order: SortOrder;
};

export enum SortOrder {
  Asc = "ASC",
  Desc = "DESC",
}

export type Subscription = {
  __typename?: "Subscription";
  itemMinted: ItemMinted;
  itemBurned: Item;
  itemPurchased: Item;
  offerUpdated?: Maybe<Offer>;
  bidPlaced: Offer;
  auctionEnded: Offer;
  auctionCancelled: Offer;
  saleCancelled: Offer;
};

export type SubscriptionItemMintedArgs = {
  tokenId: Scalars["String"];
  ethAddress: Scalars["String"];
  contractAddress: Scalars["String"];
};

export type SubscriptionItemBurnedArgs = {
  tokenId: Scalars["String"];
  contractAddress: Scalars["String"];
};

export type SubscriptionItemPurchasedArgs = {
  contractAddress: Scalars["String"];
  tokenId: Scalars["String"];
};

export type SubscriptionOfferUpdatedArgs = {
  offerId: Scalars["ID"];
};

export type SubscriptionBidPlacedArgs = {
  offerId: Scalars["ID"];
};

export type SubscriptionAuctionEndedArgs = {
  offerId: Scalars["ID"];
};

export type SubscriptionAuctionCancelledArgs = {
  offerId: Scalars["ID"];
};

export type SubscriptionSaleCancelledArgs = {
  offerId: Scalars["ID"];
};

export enum Taginterval {
  Day = "DAY",
  Week = "WEEK",
  Month = "MONTH",
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
  type: TokenType;
  contractAddress: Scalars["String"];
  chainId: Scalars["Int"];
};

export enum TokenType {
  Erc721 = "ERC721",
  Erc1155 = "ERC1155",
}

export type TopUser = {
  __typename?: "TopUser";
  user: User;
  avgMonthlyVolume: Scalars["Float"];
  totalMonthlyVolume: Scalars["Float"];
};

export type Transaction = {
  __typename?: "Transaction";
  from: Scalars["String"];
  to: Scalars["String"];
  blockNumber: Scalars["Float"];
  hash: Scalars["String"];
};

export type Transcoding = {
  __typename?: "Transcoding";
  url: Scalars["String"];
  mimeType: Scalars["String"];
};

export type UpdateUserInput = {
  email?: Maybe<Scalars["String"]>;
  twitter?: Maybe<Scalars["String"]>;
  instagram?: Maybe<Scalars["String"]>;
  website?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  name?: Maybe<Scalars["String"]>;
  profileImage?: Maybe<Scalars["String"]>;
  profileBanner?: Maybe<Scalars["String"]>;
};

export enum UploadType {
  Nft = "NFT",
  UserImage = "USER_IMAGE",
  UserHeader = "USER_HEADER",
}

export type User = {
  __typename?: "User";
  id: Scalars["String"];
  name?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  ethAddress?: Maybe<Scalars["String"]>;
  twitter?: Maybe<Scalars["String"]>;
  instagram?: Maybe<Scalars["String"]>;
  website?: Maybe<Scalars["String"]>;
  profileImage?: Maybe<Scalars["String"]>;
  profileBanner?: Maybe<Scalars["String"]>;
  verified?: Maybe<Scalars["Boolean"]>;
  fineHolderBenefits?: Maybe<FineHolderBenefits>;
  receivedComRewards: Scalars["Float"];
  roles?: Maybe<Array<UserRoles>>;
  items: ItemsResponse;
  itemsOnOffer: ItemsWithOffersResponse;
};

export type UserItemsArgs = {
  sort?: Maybe<SortInput>;
  filter?: Maybe<UserItemFilterInput>;
  paging: PagingInput;
};

export type UserItemsOnOfferArgs = {
  sort?: Maybe<SortInput>;
  filter?: Maybe<UserItemOnOfferFilterInput>;
  paging: PagingInput;
};

export type UserConsent = {
  __typename?: "UserConsent";
  /** @deprecated Deprecated, only used in frontend */
  acceptedTos?: Maybe<Scalars["Boolean"]>;
  /** @deprecated Deprecated, only used in frontend */
  acceptedPrivacyPolicy?: Maybe<Scalars["Boolean"]>;
  /** @deprecated Deprecated, only used in frontend */
  acceptedOlderThan18?: Maybe<Scalars["Boolean"]>;
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
  User = "USER",
  Moderator = "MODERATOR",
  Admin = "ADMIN",
}

export type VerificationTokenInput = {
  ethAddress: Scalars["String"];
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
  }>;
};

export type ItemSaleInfoFragment = {
  __typename?: "Offer";
  id: string;
  createdAt?: Maybe<any>;
  type?: Maybe<string>;
  supply: number;
  price: { __typename?: "Price"; amount: number; currency: PriceCurrency };
  auction?: Maybe<{
    __typename?: "Auction";
    id: string;
    startPrice?: Maybe<number>;
    startTime?: Maybe<any>;
    endTime?: Maybe<any>;
    highestBid?: Maybe<{
      __typename?: "Bid";
      transactionHash: string;
      bidAmount: number;
    }>;
  }>;
};

export type ItemInfoFragment = {
  __typename?: "Item";
  id: string;
  tokenId: string;
  contractAddress: string;
  supply: number;
  name: string;
  description?: Maybe<string>;
  chainId: number;
  creator: {
    __typename?: "User";
    id: string;
    ethAddress?: Maybe<string>;
    name?: Maybe<string>;
    profileImage?: Maybe<string>;
    verified?: Maybe<boolean>;
  };
  collection?: Maybe<{
    __typename?: "Collection";
    slug: string;
    name: string;
    iconUrl: string;
    verified: boolean;
  }>;
  properties: {
    __typename?: "Properties";
    fileType: FileType;
    imagePreview?: Maybe<string>;
    fileUrl?: Maybe<string>;
    originalFileUrl?: Maybe<string>;
    thumbnailUrl?: Maybe<string>;
    originalThumbnailUrl?: Maybe<string>;
  };
  transcodings?: Maybe<
    Array<{ __typename?: "Transcoding"; url: string; mimeType: string }>
  >;
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
    name: string;
    description?: Maybe<string>;
    chainId: number;
    creator: {
      __typename?: "User";
      id: string;
      ethAddress?: Maybe<string>;
      name?: Maybe<string>;
      profileImage?: Maybe<string>;
      verified?: Maybe<boolean>;
    };
    collection?: Maybe<{
      __typename?: "Collection";
      slug: string;
      name: string;
      iconUrl: string;
      verified: boolean;
    }>;
    properties: {
      __typename?: "Properties";
      fileType: FileType;
      imagePreview?: Maybe<string>;
      fileUrl?: Maybe<string>;
      originalFileUrl?: Maybe<string>;
      thumbnailUrl?: Maybe<string>;
      originalThumbnailUrl?: Maybe<string>;
    };
    transcodings?: Maybe<
      Array<{ __typename?: "Transcoding"; url: string; mimeType: string }>
    >;
  };
  nextEditionForSale?: Maybe<{
    __typename?: "Offer";
    id: string;
    createdAt?: Maybe<any>;
    type?: Maybe<string>;
    supply: number;
    price: { __typename?: "Price"; amount: number; currency: PriceCurrency };
    auction?: Maybe<{
      __typename?: "Auction";
      id: string;
      startPrice?: Maybe<number>;
      startTime?: Maybe<any>;
      endTime?: Maybe<any>;
      highestBid?: Maybe<{
        __typename?: "Bid";
        transactionHash: string;
        bidAmount: number;
      }>;
    }>;
  }>;
};

export type UserItemsFragment = {
  __typename?: "Item";
  userSupply: number;
  id: string;
  tokenId: string;
  contractAddress: string;
  supply: number;
  name: string;
  description?: Maybe<string>;
  chainId: number;
  nextEditionForSale?: Maybe<{
    __typename?: "Offer";
    id: string;
    createdAt?: Maybe<any>;
    type?: Maybe<string>;
    supply: number;
    price: { __typename?: "Price"; amount: number; currency: PriceCurrency };
    auction?: Maybe<{
      __typename?: "Auction";
      id: string;
      startPrice?: Maybe<number>;
      startTime?: Maybe<any>;
      endTime?: Maybe<any>;
      highestBid?: Maybe<{
        __typename?: "Bid";
        transactionHash: string;
        bidAmount: number;
      }>;
    }>;
  }>;
  creator: {
    __typename?: "User";
    id: string;
    ethAddress?: Maybe<string>;
    name?: Maybe<string>;
    profileImage?: Maybe<string>;
    verified?: Maybe<boolean>;
  };
  collection?: Maybe<{
    __typename?: "Collection";
    slug: string;
    name: string;
    iconUrl: string;
    verified: boolean;
  }>;
  properties: {
    __typename?: "Properties";
    fileType: FileType;
    imagePreview?: Maybe<string>;
    fileUrl?: Maybe<string>;
    originalFileUrl?: Maybe<string>;
    thumbnailUrl?: Maybe<string>;
    originalThumbnailUrl?: Maybe<string>;
  };
  transcodings?: Maybe<
    Array<{ __typename?: "Transcoding"; url: string; mimeType: string }>
  >;
};

export type GetUserOfferItemsQueryVariables = Exact<{
  ethAddress: Scalars["String"];
  filter?: Maybe<UserItemOnOfferFilterInput>;
  paging: PagingInput;
  sort?: Maybe<SortInput>;
}>;

export type GetUserOfferItemsQuery = {
  __typename?: "Query";
  user?: Maybe<{
    __typename?: "User";
    id: string;
    itemsOnOffer: {
      __typename?: "ItemsWithOffersResponse";
      totalCount?: Maybe<number>;
      edges?: Maybe<
        Array<{
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
              name: string;
              description?: Maybe<string>;
              chainId: number;
              creator: {
                __typename?: "User";
                id: string;
                ethAddress?: Maybe<string>;
                name?: Maybe<string>;
                profileImage?: Maybe<string>;
                verified?: Maybe<boolean>;
              };
              collection?: Maybe<{
                __typename?: "Collection";
                slug: string;
                name: string;
                iconUrl: string;
                verified: boolean;
              }>;
              properties: {
                __typename?: "Properties";
                fileType: FileType;
                imagePreview?: Maybe<string>;
                fileUrl?: Maybe<string>;
                originalFileUrl?: Maybe<string>;
                thumbnailUrl?: Maybe<string>;
                originalThumbnailUrl?: Maybe<string>;
              };
              transcodings?: Maybe<
                Array<{
                  __typename?: "Transcoding";
                  url: string;
                  mimeType: string;
                }>
              >;
            };
            nextEditionForSale?: Maybe<{
              __typename?: "Offer";
              id: string;
              createdAt?: Maybe<any>;
              type?: Maybe<string>;
              supply: number;
              price: {
                __typename?: "Price";
                amount: number;
                currency: PriceCurrency;
              };
              auction?: Maybe<{
                __typename?: "Auction";
                id: string;
                startPrice?: Maybe<number>;
                startTime?: Maybe<any>;
                endTime?: Maybe<any>;
                highestBid?: Maybe<{
                  __typename?: "Bid";
                  transactionHash: string;
                  bidAmount: number;
                }>;
              }>;
            }>;
          };
        }>
      >;
      pageInfo?: Maybe<{
        __typename?: "ItemWithOfferPageInfo";
        startCursor?: Maybe<string>;
        endCursor?: Maybe<string>;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      }>;
    };
  }>;
};

export type GetUserItemsQueryVariables = Exact<{
  ethAddress: Scalars["String"];
  filter: UserItemFilterInput;
  paging: PagingInput;
}>;

export type GetUserItemsQuery = {
  __typename?: "Query";
  user?: Maybe<{
    __typename?: "User";
    id: string;
    items: {
      __typename?: "ItemsResponse";
      totalCount?: Maybe<number>;
      edges?: Maybe<
        Array<{
          __typename?: "ItemEdge";
          cursor: string;
          node: {
            __typename?: "Item";
            userSupply: number;
            id: string;
            tokenId: string;
            contractAddress: string;
            supply: number;
            name: string;
            description?: Maybe<string>;
            chainId: number;
            nextEditionForSale?: Maybe<{
              __typename?: "Offer";
              id: string;
              createdAt?: Maybe<any>;
              type?: Maybe<string>;
              supply: number;
              price: {
                __typename?: "Price";
                amount: number;
                currency: PriceCurrency;
              };
              auction?: Maybe<{
                __typename?: "Auction";
                id: string;
                startPrice?: Maybe<number>;
                startTime?: Maybe<any>;
                endTime?: Maybe<any>;
                highestBid?: Maybe<{
                  __typename?: "Bid";
                  transactionHash: string;
                  bidAmount: number;
                }>;
              }>;
            }>;
            creator: {
              __typename?: "User";
              id: string;
              ethAddress?: Maybe<string>;
              name?: Maybe<string>;
              profileImage?: Maybe<string>;
              verified?: Maybe<boolean>;
            };
            collection?: Maybe<{
              __typename?: "Collection";
              slug: string;
              name: string;
              iconUrl: string;
              verified: boolean;
            }>;
            properties: {
              __typename?: "Properties";
              fileType: FileType;
              imagePreview?: Maybe<string>;
              fileUrl?: Maybe<string>;
              originalFileUrl?: Maybe<string>;
              thumbnailUrl?: Maybe<string>;
              originalThumbnailUrl?: Maybe<string>;
            };
            transcodings?: Maybe<
              Array<{
                __typename?: "Transcoding";
                url: string;
                mimeType: string;
              }>
            >;
          };
        }>
      >;
      pageInfo?: Maybe<{
        __typename?: "ItemPageInfo";
        startCursor?: Maybe<string>;
        endCursor?: Maybe<string>;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      }>;
    };
  }>;
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
    signature?: Maybe<string>;
    item: {
      __typename?: "Item";
      id: string;
      tokenId: string;
      contractAddress: string;
      chainId: number;
      supply: number;
      type: TokenType;
      properties: {
        __typename?: "Properties";
        fileType: FileType;
        imagePreview?: Maybe<string>;
        fileUrl?: Maybe<string>;
        ipfsUrl?: Maybe<string>;
        ipfsDocument?: Maybe<string>;
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
      supply: number;
      type: TokenType;
      properties: {
        __typename?: "Properties";
        fileType: FileType;
        imagePreview?: Maybe<string>;
        fileUrl?: Maybe<string>;
        ipfsUrl?: Maybe<string>;
        ipfsDocument?: Maybe<string>;
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
    active: boolean;
    supply: number;
    signature?: Maybe<string>;
    price: { __typename?: "Price"; amount: number; currency: PriceCurrency };
    auction?: Maybe<{
      __typename?: "Auction";
      id: string;
      auctionId?: Maybe<string>;
      startTime?: Maybe<any>;
      endTime?: Maybe<any>;
      startPrice?: Maybe<number>;
      bids: Array<{
        __typename?: "Bid";
        transactionHash: string;
        bidAmount: number;
        bidTime: any;
        bidder?: Maybe<{
          __typename?: "User";
          ethAddress?: Maybe<string>;
          description?: Maybe<string>;
          name?: Maybe<string>;
          profileImage?: Maybe<string>;
        }>;
      }>;
      highestBid?: Maybe<{
        __typename?: "Bid";
        transactionHash: string;
        bidAmount: number;
        bidTime: any;
        bidder?: Maybe<{
          __typename?: "User";
          ethAddress?: Maybe<string>;
          description?: Maybe<string>;
          name?: Maybe<string>;
          profileImage?: Maybe<string>;
        }>;
      }>;
    }>;
  };
};
