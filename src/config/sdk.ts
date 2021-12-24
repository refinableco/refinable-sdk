import { ContractTag } from "../@types/graphql";
import { Environment } from "../types/RefinableOptions";

export const apiUrl = {
  [Environment.Mainnet]: "https://api.refinable.com/graphql",
  [Environment.Testnet]: "https://api-testnet.refinable.com/graphql",
  [Environment.Local]: "http://localhost:8001/graphql",
};

export const storePubKey = {
  [Environment.Mainnet]: "TDODO",
  [Environment.Testnet]: "HY7NfjupN6r2RLnmtz9CFz7Wrzzaw5GFwx9qnNXWjLtp",
  [Environment.Local]: "HY7NfjupN6r2RLnmtz9CFz7Wrzzaw5GFwx9qnNXWjLtp",
};

export const contractsTags = {
  [Environment.Mainnet]: [
    ContractTag.SaleV3_0_1,
    ContractTag.AuctionV3_1_1,
    ContractTag.SaleNonceHolderV1_0_0,
    ContractTag.TransferProxyV1_0_0,
    ContractTag.AirdropV1_0_0,
  ],
  [Environment.Testnet]: [
    ContractTag.SaleV3_0_0,
    ContractTag.AuctionV3_1_0,
    ContractTag.SaleNonceHolderV1_0_0,
    ContractTag.TransferProxyV1_0_0,
    ContractTag.AirdropV1_0_0,
  ],
  [Environment.Local]: [
    ContractTag.SaleV3_0_0,
    ContractTag.AuctionV3_1_0,
    ContractTag.SaleNonceHolderV1_0_0,
    ContractTag.TransferProxyV1_0_0,
    ContractTag.AirdropV1_0_0,
  ],
};
