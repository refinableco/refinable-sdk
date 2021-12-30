import { Refinable, TokenType } from ".";
import {
  ContractTypes,
  GetMintableCollectionsQuery,
  GetMintableCollectionsQueryVariables,
  RefinableContractQuery,
  RefinableContractQueryVariables,
  RefinableContractsQuery,
  RefinableContractsQueryVariables,
  Token,
} from "./@types/graphql";
import { getContractsTags } from "./config/sdk";
import { Contract, IContract } from "./Contract";
import {
  GET_MINTABLE_COLLECTIONS_QUERY,
  GET_REFINABLE_CONTRACT,
  GET_REFINABLE_CONTRACTS,
} from "./graphql/contracts";
import { Chain } from "./interfaces/Network";

export class RefinableContracts {
  private cachedContracts: {
    [chainId: string]: { [address: string]: Contract };
  } = {};

  private mintableContracts: {
    [chainId: string]: { [address: string]: Token & { default: boolean } };
  };

  private baseContracts: {
    [chainId: string]: { [type: string]: Contract };
  };

  constructor(private readonly refinable: Refinable) {}

  async initialize() {
    await this.getBaseContracts(0);
  }

  async getBaseContracts(chainId: number) {
    if (this.baseContracts?.[chainId]) {
      return this.baseContracts[chainId];
    }
    const tags = getContractsTags(
      this.refinable.options.environment,
      chainId === 0 ? Chain.Local : chainId
    );

    const { refinableContracts } = await this.refinable.apiClient.request<
      RefinableContractsQuery,
      RefinableContractsQueryVariables
    >(GET_REFINABLE_CONTRACTS, {
      input: {
        tags,
      },
    });

    this.baseContracts = refinableContracts.reduce((contracts, contract) => {
      const contractsForChainId = contracts[contract.chainId] ?? {};

      contractsForChainId[contract.type] = this.cacheContract(contract);

      contracts[contract.chainId] = contractsForChainId;

      return contracts;
    }, {});

    return this.baseContracts[chainId];
  }

  async getRefinableContracts(chainId: Chain, types: ContractTypes[]) {
    const { refinableContracts } = await this.refinable.apiClient.request<
      RefinableContractsQuery,
      RefinableContractsQueryVariables
    >(GET_REFINABLE_CONTRACTS, {
      input: { types, chainId: chainId },
    });

    return refinableContracts;
  }

  async getRefinableContract(chainId: Chain, contractAddress: string) {
    const hasContract = this.getCachedContract(chainId, contractAddress);

    if (hasContract) return hasContract;

    const { refinableContract } = await this.refinable.apiClient.request<
      RefinableContractQuery,
      RefinableContractQueryVariables
    >(GET_REFINABLE_CONTRACT, {
      input: { contractAddress, chainId: chainId },
    });

    return this.cacheContract(refinableContract);
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

          contractsForChainId[token.contractAddress.toLowerCase()] =
            this.cacheContract({
              ...token,
              default: collection.default,
            });

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
    return Object.values(mintableContracts[chainId.toString()]).find(
      (token) => token.type === tokenType && token.default
    );
  }

  async getMintableTokenContract(chainId: Chain, contractAddress: string) {
    const mintableContracts = await this.getMintableContracts();

    const contract = mintableContracts[chainId][contractAddress.toLowerCase()];

    if (!contract)
      throw new Error("This contract cannot be minted through Refinable");

    return new Contract(this.refinable, contract);
  }

  async isContractDeployed(contractAddress: string) {
    const code = await this.refinable.provider.provider.getCode(
      contractAddress
    );

    return code !== "0x0";
  }

  getBaseContract(chainId: Chain, type: string) {
    if (!this.baseContracts[chainId])
      throw new Error(
        `No contract of type ${{ type }} for this chain ${chainId}`
      );

    const contract = this.baseContracts[chainId][type];
    if (!contract)
      throw new Error(
        `Unable to initialize contract for type ${type} on chain ${chainId}`
      );

    return contract;
  }

  private getCachedContract(chainId: Chain, contractAddress: string) {
    return this.cachedContracts?.[chainId]?.[contractAddress];
  }

  private cacheContract(contractOutput: IContract) {
    const contract = new Contract(this.refinable, contractOutput);

    this.cachedContracts[contract.chainId] = {
      ...(this.cachedContracts[contract.chainId] ?? {}),
      [contract.contractAddress.toLowerCase()]: contract,
    };

    return contract;
  }
}
