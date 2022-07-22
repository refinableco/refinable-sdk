import { Contract as EthersContract, providers, Signer } from "ethers";
import semver from "semver";
import {
  ContractOutput,
  ContractTag,
  ContractTypes,
  TokenType,
} from "../../@types/graphql";
import { CONTRACTS_MAP } from "./";

export interface IContract extends Omit<ContractOutput, "__typename" | "id"> {
  default?: boolean;
}

export class Contract implements IContract {
  type: ContractTypes;
  contractAddress: string;
  chainId: number;
  contractABI: string;
  tags: ContractTag[];
  default?: boolean = false;

  constructor(contract: IContract) {
    Object.assign(this, contract);
  }

  hasTags(tags: ContractTag[]) {
    return tags.every((tag) => this.tags.includes(tag));
  }

  hasTag(tag: ContractTag) {
    return this.hasTags([tag]);
  }

  hasTagSemver(prefix: string, statisfies: string) {
    return this.tags.some((tag) => {
      const [tagPrefix, rawVersion] = tag.split("_v");

      if (tagPrefix !== prefix) return false;

      return semver.satisfies(rawVersion.replace(/_/g, "."), statisfies);
    });
  }

  toEthersContract(signerOrProvider: Signer | providers.Provider) {
    return new EthersContract(
      this.contractAddress,
      this.contractABI,
      signerOrProvider
    );
  }

  getTokenType() {
    switch (this.type) {
      case ContractTypes.Erc1155Token:
      case ContractTypes.Erc1155WhitelistedToken:
        return TokenType.Erc1155;
      case ContractTypes.Erc721Token:
      case ContractTypes.Erc721WhitelistedToken:
      case ContractTypes.Erc721LazyMintToken:
        return TokenType.Erc721;
      default:
        return null;
    }
  }
}
