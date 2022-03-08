import { ContractTag } from "../@types/graphql";
import { Chain, ChainType } from "../interfaces/Network";
import { Environment } from "../types/RefinableOptions";
import { selectChainType } from "../utils/utils";

export const apiUrl = {
  [Environment.Mainnet]: "https://api.refinable.com/graphql",
  [Environment.Testnet]: "https://api-testnet.refinable.com/graphql",
  [Environment.Local]: "http://localhost:8001/graphql",
};

const v4ContractChains = [ChainType.POLYGON];
export const getContractsTags = (
  environment: Environment,
  chainId: Chain
): ContractTag[] => {
  const chain = selectChainType(chainId);

  switch (environment) {
    case Environment.Mainnet:
      return [
        ContractTag.SaleV3_1_0,
        ContractTag.AuctionV3_1_1,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
    case Environment.Testnet:
      return [
        // We're mainly testing Diamond on Polygon right now, so for the other chains we'll use the contracts with whitelist sale logic
        v4ContractChains.includes(chain)
          ? ContractTag.SaleV4_0_0
          : ContractTag.SaleV3_1_0,
        v4ContractChains.includes(chain)
          ? ContractTag.AuctionV4_0_0
          : ContractTag.AuctionV3_1_0,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
    case Environment.Local:
      return [
        chain === ChainType.BSC && process.env.FLAG_USE_DIAMOND
          ? ContractTag.SaleV4_0_0
          : ContractTag.SaleV3_1_0,
        chain === ChainType.BSC && process.env.FLAG_USE_DIAMOND
          ? ContractTag.AuctionV4_0_0
          : ContractTag.AuctionV3_1_0,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
  }
};
