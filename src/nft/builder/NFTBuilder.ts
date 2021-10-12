import { TransactionResponse } from "@ethersproject/providers";
import {
  AbstractNFT,
  CreateItemInput,
  IRoyalty,
  Refinable,
  TokenType,
} from "../..";
import {
  ContractTags,
  CreateItemMutation,
  CreateItemMutationVariables,
  FinishMintMutation,
  FinishMintMutationVariables,
} from "../../@types/graphql";
import { CREATE_ITEM, FINISH_MINT } from "../../graphql/mint";
import { optionalParam } from "../../utils";
import assert from "assert";
import { ERC721NFT } from "../ERC721NFT";
import { ERC1155NFT } from "../ERC1155NFT";

export interface NftBuilderParams
  extends Omit<CreateItemInput, "royaltySettings" | "contractAddress"> {
  royalty?: IRoyalty;
  contractAddress?: string;
}

export class NFTBuilder<NFTClass extends AbstractNFT> {
  private signature: string;
  private item: CreateItemMutation["createItem"]["item"];
  public mintTransaction: TransactionResponse;

  constructor(
    private readonly refinable: Refinable,
    private buildData?: NftBuilderParams
  ) {}

  get royaltySettings() {
    return this.buildData.royalty ? this.buildData.royalty.serialize() : null;
  }

  erc721(
    params: Omit<NftBuilderParams, "type" | "supply">
  ): NFTBuilder<ERC721NFT> {
    this.buildData = {
      ...params,
      supply: 1,
      type: TokenType.Erc721,
    };

    return this;
  }

  erc1155(params: Omit<NftBuilderParams, "type">): NFTBuilder<ERC1155NFT> {
    this.buildData = {
      ...params,
      type: TokenType.Erc1155,
    };

    return this;
  }

  /**
   * Creates an item in the DB and retrieves a tokenId and signature
   */
  async create() {
    assert(this.buildData != null, "NFT token data not initalized");
    assert(
      this.buildData.contractAddress != null,
      'Parameter "contractAddress" is required. None passed or no default contract found'
    );

    const {
      type,
      description,
      marketingDescription,
      name,
      tags,
      supply = 1,
      airdropAddresses,
      file,
      contractAddress,
      chainId,
    } = this.buildData;

    // API Call
    const { createItem } = await this.refinable.apiClient.request<
      CreateItemMutation,
      CreateItemMutationVariables
    >(CREATE_ITEM, {
      input: {
        description,
        marketingDescription,
        name,
        supply,
        royaltySettings: this.royaltySettings,
        tags,
        airdropAddresses,
        file,
        type,
        contractAddress,
        chainId,
      },
    });

    const { item, signature } = createItem;

    this.item = item;
    this.signature = signature;

    return this;
  }

  /**
   * Mints an item on-chain
   */
  async mint() {
    const tokenContract =
      await this.refinable.contracts.getMintableTokenContract(
        this.item.chainId,
        this.item.contractAddress
      );

    const mintArgs: any = [
      // uint256 _tokenId
      this.item.tokenId,
      // bytes memory _signature
      this.signature,
      // RoyaltyLibrary.RoyaltyShareDetails[] memory _royaltyShares
      this.royaltySettings?.shares
        ? this.royaltySettings.shares.map((share) => [
            share.recipient,
            share.value,
          ])
        : [],
      // uint256 _supply - Only for ERC1155
      ...optionalParam(
        TokenType[this.item.type] === TokenType.Erc1155,
        this.item.supply.toString()
      ),

      // string memory _uri,
      this.item.properties.ipfsDocument,
    ];

    if (tokenContract.hasTag(ContractTags.V2Royalties)) {
      mintArgs.push(
        // uint256 _royaltyBps
        this.royaltySettings.royaltyBps,
        // RoyaltyLibrary.Strategy _royaltyStrategy
        this.royaltySettings.royaltyStrategy
      );
    }

    if (tokenContract.hasTag(ContractTags.V3RoyaltiesPrimary)) {
      mintArgs.push(
        // _primaryRoyaltyShares - Not supported yet through the SDK
        []
      );
    }

    const nftTokenContract = tokenContract.toEthersContract(
      this.refinable.provider
    );

    const result: TransactionResponse = await nftTokenContract.mint(
      ...mintArgs
    );

    this.mintTransaction = result;

    return this;
  }

  /**
   * Action to finalize minting and return a item object
   */
  async finishMint() {
    const { tokenId, contractAddress } = this.item;

    const finishMint = await this.refinable.apiClient.request<
      FinishMintMutation,
      FinishMintMutationVariables
    >(FINISH_MINT, {
      input: {
        tokenId,
        contractAddress,
        transactionHash: this.mintTransaction.hash,
      },
    });

    return this.refinable.createNft(finishMint.finishMint.item);
  }

  /**
   * Aggregated procedure to create item in the DB, mint and finish mint
   */
  async createAndMint(): Promise<NFTClass> {
    await this.useDefaultMintContractIfUndefined();

    await this.create();
    await this.mint();
    return this.finishMint() as Promise<NFTClass>;
  }

  private async useDefaultMintContractIfUndefined() {
    if (!this.buildData.contractAddress) {
      const defaultContract =
        await this.refinable.contracts.getDefaultTokenContract(
          this.buildData.chainId,
          this.buildData.type as TokenType
        );

      if (defaultContract) {
        this.buildData.contractAddress = defaultContract.contractAddress;
      }
    }
  }
}
