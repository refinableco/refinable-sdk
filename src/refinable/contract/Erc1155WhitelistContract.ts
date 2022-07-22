import { ContractTypes } from "../../@types/graphql";
import { Contract, IContract } from "./Contract";
import { Erc721WhitelistContract } from "./Erc721WhitelistContract";

export class Erc1155WhitelistContract extends Contract {
  static type = ContractTypes.Erc1155WhitelistedToken as const;
  static deployArgsSchema = Erc721WhitelistContract.deployArgsSchema;
  constructor(contract: IContract) {
    super(contract);
  }
}
