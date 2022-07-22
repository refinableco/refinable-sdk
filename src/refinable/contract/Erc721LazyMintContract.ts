import { constants } from "ethers";
import { z } from "zod";
import { ContractTypes } from "../../@types/graphql";
import { Contract, IContract } from "./Contract";

export class Erc721LazyMintContract extends Contract {
  static type = ContractTypes.Erc721LazyMintToken as const;
  static deployArgsSchema = z.object({
    name: z.string().min(1),
    symbol: z.string().min(1),
    placeholderTokenURI: z.string().min(1),
    tokenMintLimit: z.number().positive(),
    saleSettings: z
      .object({
        maxPerMint: z.number().default(0),
        maxPerWallet: z.number().default(0),
        walletLimitBypassAddress: z.string().default(constants.AddressZero),
      })
      .optional()
      .default({
        maxPerMint: 0,
        maxPerWallet: 0,
        walletLimitBypassAddress: constants.AddressZero,
      }),
    royalties: z
      .object({
        account: z.string().default(constants.AddressZero),
        value: z.number().default(0),
      })
      .optional()
      .default({ account: constants.AddressZero, value: 0 }),
  });
  constructor(contract: IContract) {
    super(contract);
  }
}
