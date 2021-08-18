import { gql, GraphQLClient } from "graphql-request";

export type ContractType =
  | "ERC721_TOKEN"
  | "ERC1155_TOKEN"
  | "ERC721_SALE"
  | "ERC1155_SALE"
  | "ERC721_SALE_NONCE_HOLDER"
  | "ERC1155_SALE_NONCE_HOLDER"
  | "TRANSFER_PROXY"
  | "ERC721SaleNonceHolder"
  | "ERC1155SaleNonceHolder"
  | "ERC721Airdrop"
  | "ERC1155Airdrop"
  | "ERC721Auction"
  | "ERC1155Auction"
  | "TransferProxy";

export type AllContractTypes =
  | ContractType
  | "ServiceFeeProxy"
  | "ERC20"
  | "RefinableERC721WhiteListedToken"
  | "RefinableERC721WhiteListedTokenV2";

const GET_REFINABLE_CONTRACT = gql`
  query refinableContracts($input: GetRefinableContractsInput!) {
    refinableContracts(input: $input) {
      contractAddress
      contractABI
      type
    }
  }
`;

export const getContracts = (
  apiClient: GraphQLClient,
  types: ContractType[],
  chainId = 1337
) => {
  return apiClient.request(GET_REFINABLE_CONTRACT, {
    input: { types, chainId },
  });
};
