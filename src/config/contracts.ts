import { ContractTag, ContractTypes } from "../@types/graphql";
import { Chain, EVM_CHAIN_IDS } from "../interfaces/Network";
import { Environment } from "../types/RefinableOptions";

export const CONTRACT_MAP: Record<
  EVM_CHAIN_IDS,
  {
    [ContractTypes.Erc721SaleNonceHolder]: string;
    [ContractTypes.ServiceFeeV2]: string;
  }
> = {
  [Chain.Local]: {
    [ContractTypes.Erc721SaleNonceHolder]:
      "0x1c2bc54D713d8b4e40Da765435E23a51eCcCfd90",
    [ContractTypes.ServiceFeeV2]: "0xdED6C6305B2Df31c216bA1F9A006B712B371625F",
  },
  // BSC
  [Chain.BscMainnet]: {
    [ContractTypes.Erc721SaleNonceHolder]:
      "0xe29a6b58a5ab2724a903803cc04fe360a62bb61d",
    [ContractTypes.ServiceFeeV2]: "0x359B03693F48760a5634C16f9ebdD39c0eAf802e",
  },
  [Chain.BscTestnet]: {
    [ContractTypes.Erc721SaleNonceHolder]:
      "0x0248BBd2744f2107346346fc7B8AeFB9B74c8214",
    [ContractTypes.ServiceFeeV2]: "0x328bC24E651DbBF7Fb7bCb5d62dB4a9FEC970626",
  },
  // ETH
  [Chain.Ethereum]: {
    [ContractTypes.Erc721SaleNonceHolder]:
      "0x90a509C5db1A18564470c03A316fAd593f23fFE9",
    [ContractTypes.ServiceFeeV2]: "0x3E20333b4d582467BDCFf6769507dec767e546BE",
  },
  [Chain.EthereumGoerli]: {
    [ContractTypes.Erc721SaleNonceHolder]:
      "0x977f3E5DdA84Fb7c3cF1a8c157a21B3457435138",
    [ContractTypes.ServiceFeeV2]: "0x6924395583117e91308Acb57Df87D148Ff6EAafF",
  },
  // Polygon
  [Chain.PolygonMainnet]: {
    [ContractTypes.Erc721SaleNonceHolder]:
      "0x0c4e815600F4131Ea1CDB9e557678d314323D5f5",
    [ContractTypes.ServiceFeeV2]: "0x9Dfe730E88644fF4F0c089202d448C0090693e2a",
  },
  [Chain.PolygonTestnet]: {
    [ContractTypes.Erc721SaleNonceHolder]:
      "0xdED6C6305B2Df31c216bA1F9A006B712B371625F",
    [ContractTypes.ServiceFeeV2]: "0xE4E78ae21bddB82e4d88B4ff635FBf52597A471E",
  },
};

export const getContractAddress = (
  chainId: EVM_CHAIN_IDS,
  type: keyof typeof CONTRACT_MAP["1"]
) => {
  return CONTRACT_MAP[chainId][type];
};

export const getContractsTags = (environment: Environment): ContractTag[] => {
  switch (environment) {
    case Environment.Mainnet:
      return [
        ContractTag.ServiceFeeV1_0_0,
        ContractTag.SaleV4_1_2,
        ContractTag.AuctionV5_0_1,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
    case Environment.Testnet:
      return [
        ContractTag.ServiceFeeV1_0_0,
        ContractTag.SaleV4_1_3,
        ContractTag.AuctionV5_0_2,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
    case Environment.Local:
      return [
        ContractTag.ServiceFeeV1_0_0,
        ContractTag.SaleV4_1_3,
        ContractTag.AuctionV5_0_2,
        ContractTag.SaleNonceHolderV1_0_0,
        ContractTag.TransferProxyV1_0_0,
        ContractTag.AirdropV1_0_0,
      ];
  }
};
