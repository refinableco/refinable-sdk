import { RefinableEvmClient, TokenType } from "..";
import {
  ContractTypes,
  GetMintableCollectionsQuery,
  GetMintableCollectionsQueryVariables,
  RefinableContractQuery,
  RefinableContractQueryVariables,
  RefinableContractsQuery,
  RefinableContractsQueryVariables,
  CreateContractMutation,
  CreateContractMutationVariables,
  Token,
  CollectionInput,
  GetCollectionBySlugQuery,
  GetCollectionBySlugQueryVariables,
} from "../@types/graphql";
import {
  contractMetadata,
  getContractsTags,
  ipfsUrl,
  signer,
} from "../config/sdk";
import { Contract, IContract } from "../Contract";
import {
  CREATE_CONTRACT,
  GET_COLLECTION,
  GET_MINTABLE_COLLECTIONS_QUERY,
  GET_REFINABLE_CONTRACT,
  GET_REFINABLE_CONTRACTS,
} from "../graphql/contracts";
import { Chain } from "../interfaces/Network";
import { ContractFactory } from "ethers";
import EvmTransaction from "../transaction/EvmTransaction";
import { optionalParam } from "../utils/utils";
import { SdkCollectionInput } from "./interfaces/Contracts";

export class Contracts {
  private cachedContracts: {
    [chainId: string]: { [address: string]: Contract };
  } = {};

  private mintableContracts: {
    [chainId: string]: { [address: string]: Token & { default: boolean } };
  };

  private baseContracts: {
    [chainId: string]: { [type: string]: Contract };
  };

  constructor(private readonly refinable: RefinableEvmClient) {}

  async initialize() {
    await this.getBaseContracts(0);
  }

  async getBaseContracts(chainId: number) {
    if (this.baseContracts?.[chainId]) {
      return this.baseContracts[chainId];
    }
    const networkId = await this.refinable.provider.getChainId();
    const tags = getContractsTags(
      this.refinable.options.environment,
      networkId
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

  async getRefinableContract(
    chainId: Chain,
    contractAddress: string,
    types: ContractTypes[]
  ) {
    const hasContract = this.getCachedContract(chainId, contractAddress);

    if (hasContract) return hasContract;

    const { refinableContract } = await this.refinable.apiClient.request<
      RefinableContractQuery,
      RefinableContractQueryVariables
    >(GET_REFINABLE_CONTRACT, {
      input: { contractAddress, chainId, types },
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

  async createCollection(collection: SdkCollectionInput) {
    const collRes = await this.refinable.apiClient.request<
      GetCollectionBySlugQuery,
      GetCollectionBySlugQueryVariables
    >(GET_COLLECTION, {
      slug: collection.slug,
    });

    if (!!collRes?.collection?.slug) {
      throw new Error("Collection slug is duplicated");
    }

    const is1155 = collection.tokenType === TokenType.Erc1155;
    const { abi }: { abi: any } = is1155
      ? await import("../artifacts/abi/RefinableERC1155WhitelistedV3.json")
      : await import("../artifacts/abi/RefinableERC721WhitelistedV3.json");
    const { bytecode: contractByteCode }: { bytecode: string } = is1155
      ? await import("../artifacts/bytecode/RefinableERC1155WhitelistedV3.json")
      : await import("../artifacts/bytecode/RefinableERC721WhitelistedV3.json");

    const factory = new ContractFactory(
      abi,
      contractByteCode,
      this.refinable.provider
    );

    const metadataUri = contractMetadata[this.refinable.options.environment];
    const ipfsUri = ipfsUrl[this.refinable.options.environment];
    const signerAddress = signer[this.refinable.options.environment];
    const contract = await factory.deploy(
      collection.title,
      collection.symbol,
      this.refinable.accountAddress,
      signerAddress,
      metadataUri,
      ipfsUri, // uri
      ...optionalParam(is1155, ipfsUri)
    );

    await contract.deployed();

    await contract.addMinter(this.refinable.accountAddress);

    const tx = new EvmTransaction(contract.deployTransaction);

    await tx.wait();

    if (!(typeof collection.avatar === "string")) {
      collection.avatar = await this.refinable.uploadFile(collection.avatar);
    }

    const { createContract: dbContractResponse } =
      await this.refinable.apiClient.request<
        CreateContractMutation,
        CreateContractMutationVariables
      >(CREATE_CONTRACT, {
        data: {
          contract: {
            contractAddress: tx.txReceipt.contractAddress,
            chainId: await this.refinable.provider.getChainId(),
            contractType: is1155
              ? ContractTypes.Erc1155WhitelistedToken
              : ContractTypes.Erc721WhitelistedToken,
          },
          collection: collection as CollectionInput,
        },
      });

    const cachedContract = this.cacheContract(dbContractResponse);

    return {
      tx,
      contract: cachedContract,
    };
  }
}
