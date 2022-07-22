import { ContractTypes } from "../../@types/graphql";
import { ValueOf } from "../interfaces/types";
import { Erc1155WhitelistContract } from "./Erc1155WhitelistContract";
import { Erc721LazyMintContract } from "./Erc721LazyMintContract";
import { Erc721WhitelistContract } from "./Erc721WhitelistContract";

export const CONTRACTS_MAP = {
  [ContractTypes.Erc721WhitelistedToken]: Erc721WhitelistContract,
  [ContractTypes.Erc1155WhitelistedToken]: Erc1155WhitelistContract,
  [ContractTypes.Erc721LazyMintToken]: Erc721LazyMintContract,
};

export type DeployableContracts = ValueOf<typeof CONTRACTS_MAP>;
