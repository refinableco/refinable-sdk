import { AbstractNFT, Refinable, TokenType } from "../..";
import {
  CreateItemMutation,
  CreateItemMutationVariables,
  FinishMintMutation,
  FinishMintMutationVariables,
} from "../../@types/graphql";
import { CREATE_ITEM, FINISH_MINT } from "../../graphql/mint";
import EvmTransaction from "../../transaction/EvmTransaction";
import { isERC1155Item } from "../../utils/is";
import { optionalParam } from "../../utils/utils";
import { AbstractEvmNFT } from "../AbstractEvmNFT";
import { ERC1155NFT } from "../ERC1155NFT";
import { ERC721NFT } from "../ERC721NFT";
import {
  IBuilder,
  NftBuilderParams,
  NftBuilderParamsWithFileStream,
} from "./IBuilder";

export class NFTBuilder<NFTClass extends AbstractEvmNFT = AbstractEvmNFT>
  implements IBuilder<NFTClass>
{
  private signature: string;
  private item: CreateItemMutation["createItem"]["item"];
  public mintTransaction: EvmTransaction;

  constructor(
    private readonly refinable: Refinable,
    private buildData?: NftBuilderParams
  ) {}

  get tokenId() {
    if (!this.item) throw new Error("Item not created, please create first");

    return this.item.tokenId;
  }

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
    if (this.buildData == null) {
      throw new Error("NFT token data not initalized");
    }

    if (this.buildData.contractAddress == null) {
      throw new Error(
        `'Parameter "contractAddress" is required. None passed or no default contract found'`
      );
    }

    if (this.buildData.type === TokenType.Spl)
      throw new Error("Not supported yet");

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

    const { createItem } = await this.refinable.graphqlClient.request<
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
    if (this.item == null || this.signature == null)
      throw new Error("Item not created, please create first");

    const tokenContract =
      await this.refinable.evm.contracts.getMintableTokenContract(
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
      ...optionalParam(isERC1155Item(this.item), this.item.supply.toString()),
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

    const result = await tokenContract
      .connect(this.refinable.provider)
      .sendTransaction("mint", mintArgs);

    this.mintTransaction = result;

    return this;
  }

  /**
   * Action to finalize minting and return a item object
   */
  async finishMint(): Promise<AbstractNFT> {
    if (!this.mintTransaction)
      throw new Error("Item not minted, please mint first");

    const { tokenId, contractAddress, chainId } = this.item;

    const finishMint = await this.refinable.graphqlClient.request<
      FinishMintMutation,
      FinishMintMutationVariables
    >(FINISH_MINT, {
      input: {
        chainId,
        tokenId,
        contractAddress,
        transactionHash: this.mintTransaction.txId,
      },
    });

    return this.refinable.createNft(
      finishMint.finishMint.item as any
    ) as AbstractNFT;
  }

  /**
   * Aggregated procedure to create item in the DB, mint and finish mint
   */
  async createAndMint(): Promise<NFTClass> {
    await this.useDefaultMintContractIfUndefined();

    this.buildData.file = await this.refinable.uploadFile(
      this.buildData.nftFile
    );

    // in case it's a video, we can choose to add an image
    if (this.buildData.thumbnailFileStream) {
      this.buildData.thumbnail = await this.refinable.uploadFile(
        this.buildData.thumbnailFileStream
      );
    }

    await this.create();
    await this.mint();
    return this.finishMint() as Promise<NFTClass>;
  }

  private async useDefaultMintContractIfUndefined() {
    if (!this.buildData.contractAddress) {
      const defaultContract =
        await this.refinable.evm.contracts.getDefaultTokenContract(
          this.buildData.chainId,
          this.buildData.type as TokenType
        );

      if (defaultContract) {
        this.buildData.contractAddress = defaultContract.contractAddress;
      }
    }
  }
}
