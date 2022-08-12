import { TokenType } from "..";
import {
  ContractTypes,
  CreateContractMutation,
  CreateContractMutationVariables,
  GetMintableCollectionsQuery,
  GetMintableCollectionsQueryVariables,
  GetTokenContractQuery,
  GetTokenContractQueryVariables,
  RefinableContractQuery,
  RefinableContractQueryVariables,
  RefinableContractsQuery,
  RefinableContractsQueryVariables,
} from "../@types/graphql";
import { getContractsTags } from "../config/contracts";
import { ContractNotFoundError } from "../errors/ContractNotFoundError";
import {
  CREATE_CONTRACT,
  FIND_TOKEN_CONTRACT,
  GET_MINTABLE_COLLECTIONS_QUERY,
  GET_REFINABLE_CONTRACT,
  GET_REFINABLE_CONTRACTS,
} from "../graphql/contracts";
import { Chain } from "../interfaces/Network";
import { Contract, IContract } from "./contract/Contract";
import { ContractFactory } from "./ContractFactory";
import { Refinable } from "./Refinable";

export class Contracts {
  private cachedContracts: {
    [chainId: string]: { [address: string]: Contract };
  } = {};

  private mintableContracts: {
    [chainId: string]: { [address: string]: Contract };
  };

  private baseContracts: {
    [chainId: string]: { [type: string]: Contract };
  };

  private initializing = false;

  constructor(private readonly refinable: Refinable) {}

  async initialize() {
    if (this.initializing) return;

    this.initializing = true;
    await this.getBaseContracts(0);
  }

  async getBaseContracts(chainId: number) {
    if (this.baseContracts?.[chainId]) {
      return this.baseContracts[chainId];
    }
    const tags = getContractsTags(this.refinable.options.environment);

    const { refinableContracts } = await this.refinable.graphqlClient.request<
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
    const { refinableContracts } = await this.refinable.graphqlClient.request<
      RefinableContractsQuery,
      RefinableContractsQueryVariables
    >(GET_REFINABLE_CONTRACTS, {
      input: { types, chainId: chainId },
    });

    return refinableContracts;
  }

  async getRefinableContract(
    chainId: Chain,
    contractAddress: string,
    types: ContractTypes[]
  ) {
    const hasContract = this.getCachedContract(chainId, contractAddress);

    if (hasContract) return hasContract;

    const response = await this.refinable.graphqlClient.request<
      RefinableContractQuery,
      RefinableContractQueryVariables
    >(GET_REFINABLE_CONTRACT, {
      input: { contractAddress, chainId, types },
    });

    if (!response?.refinableContract)
      throw new ContractNotFoundError({ contractAddress, chainId });

    return this.cacheContract(response?.refinableContract);
  }

  async getRefinableContractByType(chainId: Chain, types: ContractTypes[]) {
    const response = await this.refinable.graphqlClient.request<
      RefinableContractQuery,
      RefinableContractQueryVariables
    >(GET_REFINABLE_CONTRACT, {
      input: { chainId, types },
    });

    if (!response?.refinableContract)
      throw new ContractNotFoundError({ chainId, type: types[0] });

    return this.cacheContract(response.refinableContract);
  }

  async getMintableContracts() {
    if (this.mintableContracts) {
      return this.mintableContracts;
    }

    const { mintableCollections } = await this.refinable.graphqlClient.request<
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
              type: token.contractType,
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
      (token) => token.tokenType === tokenType && token.default
    );
  }

  async getMintableTokenContract(chainId: Chain, contractAddress: string) {
    const mintableContracts = await this.getMintableContracts();

    const contract = mintableContracts[chainId][contractAddress.toLowerCase()];

    if (!contract)
      throw new Error("This contract cannot be minted through Refinable");

    return ContractFactory.getContract(contract, this.refinable.evm.options);
  }

  async isContractDeployed(contractAddress: string) {
    const code = await this.refinable.evm.provider.getCode(contractAddress);

    return code !== "0x0";
  }

  async findContract<C extends Contract = Contract>({
    contractAddress,
    chainId,
  }: {
    contractAddress: string;
    chainId: Chain;
  }): Promise<C> {
    const hasContract = this.getCachedContract<C>(chainId, contractAddress);

    if (hasContract) return hasContract;

    const response = await this.refinable.graphqlClient.request<
      GetTokenContractQuery,
      GetTokenContractQueryVariables
    >(FIND_TOKEN_CONTRACT, {
      input: { contractAddress, chainId },
    });

    if (!response?.contract)
      throw new ContractNotFoundError({ contractAddress, chainId });

    return this.cacheContract<C>(response?.contract);
  }

  async findAndConnectContract<C extends Contract = Contract>(params: {
    contractAddress: string;
    chainId: Chain;
  }): Promise<C> {
    const contract = await this.refinable.evm.contracts.findContract<C>(params);

    return contract.connect(this.refinable.provider);
  }

  getBaseContract(chainId: Chain, type: string) {
    if (!this.baseContracts[chainId])
      throw new Error(`No contract of type ${type} for this chain ${chainId}`);

    const contract = this.baseContracts[chainId][type];

    if (!contract) throw new ContractNotFoundError({ type, chainId });

    return contract;
  }

  private getCachedContract<C extends Contract = Contract>(
    chainId: Chain,
    contractAddress: string
  ) {
    if (!contractAddress || !chainId) return null;
    return this.cachedContracts?.[chainId]?.[
      contractAddress.toLowerCase()
    ] as C;
  }

  private cacheContract<C extends Contract = Contract>(
    contractOutput: IContract
  ) {
    const contract = ContractFactory.getContract(
      contractOutput,
      this.refinable.evm.options
    );

    this.cachedContracts[contract.chainId] = {
      ...(this.cachedContracts[contract.chainId] ?? {}),
      [contract.contractAddress.toLowerCase()]: contract,
    };

    return contract as C;
  }

  public async registerContract(
    chainId: number,
    contractType: ContractTypes,
    contractAddress: string,
    contractAbi: string
  ) {
    const { createContract: response } =
      await this.refinable.graphqlClient.request<
        CreateContractMutation,
        CreateContractMutationVariables
      >(CREATE_CONTRACT, {
        data: {
          contract: {
            contractAddress,
            chainId,
            contractType,
            contractAbi,
          },
        },
      });

    const contract = this.cacheContract(response);

    return {
      id: response.id,
      contract,
    };
  }
}
