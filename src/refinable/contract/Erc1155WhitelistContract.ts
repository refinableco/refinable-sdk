import { ContractTypes } from "../../@types/graphql";
import { RefinableEvmOptions } from "../../types/RefinableOptions";
import { Refinable } from "../Refinable";
import { WhitelistContract } from "./AbstractWhitelistContract";
import { Contract, IContract } from "./Contract";
import { Erc721WhitelistContract } from "./Erc721WhitelistContract";

export class Erc1155WhitelistContract extends WhitelistContract {
  static type = ContractTypes.Erc1155WhitelistedToken as const;
  static deployArgsSchema = Erc721WhitelistContract.deployArgsSchema;
  constructor(
    refinable: Refinable,
    contract: IContract,
    evmOptions: RefinableEvmOptions
  ) {
    super(refinable, contract, evmOptions);
  }
}
