import { ContractTag } from "../@types/graphql";
import { Chain } from "../interfaces/Network";
import { Environment } from "../types/RefinableOptions";

export const apiUrl = {
  [Environment.Mainnet]: "https://api.refinable.com/graphql",
  [Environment.Testnet]: "https://api-testnet.refinable.com/graphql",
  [Environment.Local]: "http://localhost:8001/graphql",
};

export const contractMetadata = {
  [Environment.Mainnet]: "https://api.refinable.com/contractMetadata/{address}",
  [Environment.Testnet]:
    "https://api-testnet.refinable.com/contractMetadata/{address}",
  [Environment.Local]: "http://localhost:8001/contractMetadata/{address}",
};

export const ipfsUrl = {
  [Environment.Mainnet]: "https://ipfs.refinable.com/ipfs/",
  [Environment.Testnet]: "https://ipfs-testnet.refinable.com/ipfs/",
  [Environment.Local]: "http://localhost:8080/ipfs/",
};

export const signer = {
  [Environment.Mainnet]: "0xD2E49cfd5c03a72a838a2fC6bB5f6b46927e731A",
  [Environment.Testnet]: "0xd4039eB67CBB36429Ad9DD30187B94f6A5122215",
  [Environment.Local]: "0xd4039eB67CBB36429Ad9DD30187B94f6A5122215",
};

export const getContractsTags = (
  environment: Environment,
  chainId: Chain
): ContractTag[] => {
  switch (environment) {
    case Environment.Mainnet:
      return [
        ContractTag.SaleV4_1_0,
        ContractTag.AuctionV3_1_1,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
    case Environment.Testnet:
      return [
        ContractTag.SaleV4_1_0,
        ContractTag.AuctionV5_0_0,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
    case Environment.Local:
      return [
        ContractTag.SaleV4_1_0,
        ContractTag.AuctionV5_0_0,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
  }
};
