import { Contract as EthersContract, providers, Signer } from "ethers";
import semver from "semver";
import { ContractOutput, ContractTag, TokenType } from "./@types/graphql";
import { Refinable } from "./refinable/Refinable";
export interface IContract extends Omit<ContractOutput, "__typename"> {
  default?: boolean;
}

export class Contract implements IContract {
  type: TokenType;
  contractAddress: string;
  chainId: number;
  contractABI: string;
  tags: ContractTag[];
  default: boolean = false;

  constructor(
    private readonly refinable: Refinable,
    params: IContract
  ) {
    Object.assign(this, params);
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

  toEthersContract(signerOrProvider?: Signer | providers.Provider) {
    return new EthersContract(
      this.contractAddress,
      this.contractABI,
      signerOrProvider ?? this.refinable.provider
    );
  }
}
