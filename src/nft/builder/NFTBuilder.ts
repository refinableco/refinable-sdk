import { TransactionResponse } from "@ethersproject/providers";
import assert from "assert";
import {
  AbstractNFT,
  CreateItemInput,
  IRoyalty,
  Refinable,
  TokenType,
} from "../..";
import {
  CreateItemMutation,
  CreateItemMutationVariables,
  FinishMintMutation,
  FinishMintMutationVariables,
} from "../../@types/graphql";
import { CREATE_ITEM, FINISH_MINT } from "../../graphql/mint";
import { optionalParam } from "../../utils/utils";
import { ERC1155NFT } from "../ERC1155NFT";
import { ERC721NFT } from "../ERC721NFT";
import { Stream } from "form-data";
import { NFTBatchBuilder } from "./NFTBatchBuilder";
import {
  IBuilder,
  NftBuilderParams,
  NftBuilderParamsWithFileStream,
} from "./IBuilder";

export class NFTBuilder<NFTClass extends AbstractNFT = AbstractNFT>
  implements IBuilder<NFTClass>
{
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
    params: Omit<NftBuilderParamsWithFileStream, "type" | "supply">
  ): NFTBuilder<ERC721NFT> {
    this.buildData = {
      ...params,
      supply: 1,
      type: TokenType.Erc721,
    };

    return this;
  }

  erc1155(
    params: Omit<NftBuilderParamsWithFileStream, "type">
  ): NFTBuilder<ERC1155NFT> {
    this.buildData = {
      ...params,
      type: TokenType.Erc1155,
    };

    return this as any;
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
      thumbnail,
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
        thumbnail,
        royaltySettings: this.buildData.royalty,
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
      this.royaltySettings?.shares,
      // uint256 _supply - Only for ERC1155
      ...optionalParam(
        this.item.type === TokenType.Erc1155,
        this.item.supply.toString()
      ),

      // string memory _uri,
      this.item.properties.ipfsDocument,
    ];

    if (tokenContract.hasTagSemver("TOKEN", ">=2.0.0")) {
      mintArgs.push(
        // uint256 _royaltyBps
        this.royaltySettings.royaltyBps,
        // RoyaltyLibrary.Strategy _royaltyStrategy
        this.royaltySettings.royaltyStrategy
      );
    }

    if (tokenContract.hasTagSemver("TOKEN", "^3.0.0")) {
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

    await result.wait(this.refinable.options.waitConfirmations);

    this.mintTransaction = result;

    return this;
  }

  /**
   * Action to finalize minting and return a item object
   */
  async finishMint(): Promise<AbstractNFT> {
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

    return this.refinable.createNft(finishMint.finishMint.item) as AbstractNFT;
  }

  /**
   * Aggregated procedure to create item in the DB, mint and finish mint
   */
  async createAndMint(): Promise<NFTClass> {
    await this.useDefaultMintContractIfUndefined();

    this.buildData.file = await this.refinable.uploadFile(
      this.buildData.nftFile
    );

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
