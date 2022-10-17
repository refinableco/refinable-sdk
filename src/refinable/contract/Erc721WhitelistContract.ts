import { z } from "zod";
import { ContractTypes } from "../../@types/graphql";
import { RefinableEvmOptions } from "../../types/RefinableOptions";
import { WhitelistContract } from "./AbstractWhitelistContract";
import { IContract } from "./Contract";

export class Erc721WhitelistContract extends WhitelistContract {
  static type = ContractTypes.Erc721WhitelistedToken as const;
  static deployArgsSchema = z.object({
    name: z.string().min(1),
    symbol: z.string().min(1),
    uri: z.string().optional(),
  });

  constructor(contract: IContract, evmOptions: RefinableEvmOptions) {
    super(contract, evmOptions);
  }
}
