import { ethers, Signer } from "ethers";
import {
  ContractOutput,
  ContractTags,
  Token,
  TokenType,
} from "./@types/graphql";
import { Refinable } from "./Refinable";
import semver from "semver";
export interface IContract extends Omit<ContractOutput, "__typename"> {
  default?: boolean;
}

export class Contract implements IContract {
  type: TokenType;
  contractAddress: string;
  chainId: number;
  contractABI: string;
  tags: ContractTags[];
  default: boolean = false;

  constructor(private readonly refinable: Refinable, params: IContract) {
    Object.assign(this, params);
  }

  hasTags(tags: ContractTags[]) {
    return tags.every((tag) => this.tags.includes(tag));
  }

  hasTag(tag: ContractTags) {
    return this.hasTags([tag]);
  }

  hasTagSemver(prefix: string, statisfies: string) {
    return this.tags.some((tag) => {
      const [tagPrefix, rawVersion] = tag.split("_v");

      if (tagPrefix !== prefix) return false;

      return semver.satisfies(rawVersion.replace(/_/g, "."), statisfies);
    });
  }

  toEthersContract(signerOrProvider?: Signer | ethers.providers.Provider) {
    return new ethers.Contract(
      this.contractAddress,
      this.contractABI,
      signerOrProvider ?? this.refinable.provider
    );
  }
}
