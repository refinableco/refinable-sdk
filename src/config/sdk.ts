import { ContractTag } from "../@types/graphql";
import { ChainType } from "../interfaces/Network";
import { Environment } from "../types/RefinableOptions";

export const apiUrl = {
  [Environment.Mainnet]: "https://api.refinable.com/graphql",
  [Environment.Testnet]: "https://api-testnet.refinable.com/graphql",
  [Environment.Local]: "http://localhost:8001/graphql",
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
    ChainType.BSC ? ContractTag.SaleV4_0_0 : ContractTag.SaleV3_0_1,
    ContractTag.AuctionV3_1_0,
    ContractTag.SaleNonceHolderV1_0_0,
    ContractTag.TransferProxyV1_0_0,
    ContractTag.AirdropV1_0_0,
  ],
  [Environment.Local]: [
    ChainType.BSC ? ContractTag.SaleV4_0_0 : ContractTag.SaleV3_0_1,
    ContractTag.AuctionV3_1_0,
    ContractTag.SaleNonceHolderV1_0_0,
    ContractTag.TransferProxyV1_0_0,
    ContractTag.AirdropV1_0_0,
  ],
};
