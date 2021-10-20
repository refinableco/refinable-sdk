import { ethers, Signer } from "ethers";
import { ContractTags, Token, TokenType } from "./@types/graphql";

export class Contract implements Token {
  type: TokenType;
  contractAddress: string;
  chainId: number;
  contractABI: string;
  tags: ContractTags[];
  default: boolean;

  constructor(params: Token) {
    Object.assign(this, params);
  }

  hasTags(tags: ContractTags[]) {
    return tags.every((tag) => this.tags.includes(tag));
  }

  hasTag(tag: ContractTags) {
    return this.hasTags([tag]);
  }

  toEthersContract(signerOrProvider?: Signer | ethers.providers.Provider) {
    return new ethers.Contract(
      this.contractAddress,
      this.contractABI,
      signerOrProvider
    );
  }
}
