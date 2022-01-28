import { ContractTag } from "../@types/graphql";
import { Chain, ChainType } from "../interfaces/Network";
import { Environment } from "../types/RefinableOptions";
import { selectChainType } from "../utils/utils";

export const apiUrl = {
  [Environment.Mainnet]: "https://api.refinable.com/graphql",
  [Environment.Testnet]: "https://api-testnet.refinable.com/graphql",
  [Environment.Local]: "http://localhost:8001/graphql",
};

const v4ContractChains = [ChainType.POLYGON, ChainType.BSC];
export const getContractsTags = (
  environment: Environment,
  chainId: Chain
): ContractTag[] => {
  const chain = selectChainType(chainId);

  switch (environment) {
    case Environment.Mainnet:
      return [
        ContractTag.SaleV3_0_1,
        ContractTag.AuctionV3_1_1,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
    case Environment.Testnet:
      return [
        v4ContractChains.includes(chain)
          ? ContractTag.SaleV4_0_0
          : ContractTag.SaleV3_0_0,
        chain === ChainType.POLYGON
          ? ContractTag.AuctionV4_0_0
          : ContractTag.AuctionV3_1_0,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
    case Environment.Local:
      return [
        chain === ChainType.BSC
          ? ContractTag.SaleV4_0_0
          : ContractTag.SaleV3_0_1,
        chain === ChainType.BSC
          ? ContractTag.AuctionV4_0_0
          : ContractTag.AuctionV3_1_0,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
  }
};
