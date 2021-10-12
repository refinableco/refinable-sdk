import { Refinable, TokenType } from ".";
import {
  ContractTypes,
  GetMintableCollectionsQuery,
  GetMintableCollectionsQueryVariables,
  RefinableContractsQuery,
  RefinableContractsQueryVariables,
  Token,
} from "./@types/graphql";
import { Contract } from "./Contract";
import {
  GET_MINTABLE_COLLECTIONS_QUERY,
  GET_REFINABLE_CONTRACT,
} from "./graphql/contracts";
import { Chain } from "./interfaces/Network";

export class RefinableContracts {
  private mintableContracts: {
    [chainId: string]: { [address: string]: Token & { default: boolean } };
  };

  constructor(private readonly refinable: Refinable) {}

  async getRefinableContracts(chainId: Chain, types: ContractTypes[]) {
    const { refinableContracts } = await this.refinable.apiClient.request<
      RefinableContractsQuery,
      RefinableContractsQueryVariables
    >(GET_REFINABLE_CONTRACT, {
      input: { types, chainId: chainId },
    });

    return refinableContracts;
  }

  async getMintableContracts() {
    if (this.mintableContracts) {
      return this.mintableContracts;
    }

    const { mintableCollections } = await this.refinable.apiClient.request<
      GetMintableCollectionsQuery,
      GetMintableCollectionsQueryVariables
    >(GET_MINTABLE_COLLECTIONS_QUERY);

    this.mintableContracts = mintableCollections.reduce(
      (contracts, collection) => {
        collection.tokens.forEach((token) => {
          const contractsForChainId = contracts[token.chainId] ?? {};

          contractsForChainId[token.contractAddress.toLowerCase()] = {
            ...token,
            default: collection.default,
          };

          contracts[token.chainId] = contractsForChainId;
        });

        return contracts;
      },
      {}
    );

    return this.mintableContracts;
  }

  async getDefaultTokenContract(chainId: Chain, tokenType: TokenType) {
    const mintableContracts = await this.getMintableContracts();

    return Object.values(mintableContracts[chainId]).find(
      (token) => TokenType[token.type] === tokenType && token.default
    );
  }

  async getMintableTokenContract(chainId: Chain, contractAddress: string) {
    const mintableContracts = await this.getMintableContracts();

    const contract = mintableContracts[chainId][contractAddress.toLowerCase()];

    if (!contract)
      throw new Error("This contract cannot be minted through Refinable");

    return new Contract(contract);
  }
}
