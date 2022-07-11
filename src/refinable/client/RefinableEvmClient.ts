import { JsonRpcProvider } from "@ethersproject/providers";
import _ from "lodash";
import { Chain, NFTBuilder } from "../..";
import { getChainByNetworkId } from "../../config/chains";
import { NftBuilderParams } from "../../nft/builder/IBuilder";
import {
  RefinableEvmOptions,
  RefinableOptions,
} from "../../types/RefinableOptions";
import EvmAccount from "../account/EvmAccount";
import { Contracts } from "../Contracts";
import { Refinable } from "../Refinable";
import { RoyaltyRegistry } from "../RoyaltyRegistry";

export type ContractType =
  | "ERC721_TOKEN"
  | "ERC1155_TOKEN"
  | "ERC721_AUCTION"
  | "ERC1155_AUCTION"
  | "SALE"
  | "ERC721_SALE_NONCE_HOLDER"
  | "ERC1155_SALE_NONCE_HOLDER"
  | "TRANSFER_PROXY"
  | "ERC721SaleNonceHolder"
  | "ERC1155SaleNonceHolder"
  | "ERC721Airdrop"
  | "ERC1155Airdrop"
  | "ERC721Auction"
  | "ERC1155Auction"
  | "TransferProxy";

export type AllContractTypes =
  | ContractType
  | "ServiceFeeProxy"
  | "ERC20"
  | "RefinableERC721WhiteListedToken"
  | "RefinableERC721WhiteListedTokenV2";

export enum UserItemFilterType {
  Created = "CREATED",
  Owned = "OWNED",
}

export class RefinableEvmClient {
  public account: EvmAccount;
  public options: RefinableEvmOptions = { waitConfirmations: 3 };
  public contracts: Contracts;

  async init() {
    await this.contracts.initialize();
  }

  constructor(
    options: RefinableOptions,
    private readonly refinableClient: Refinable
  ) {
    this.options = _.merge(this.options, options.evm);

    this.account = new EvmAccount(refinableClient);
    this.contracts = new Contracts(refinableClient);
  }

  nftBuilder(params?: NftBuilderParams) {
    return new NFTBuilder(this.refinableClient, params);
  }

  royaltyRegistry(chainId: Chain) {
    return new RoyaltyRegistry(this.refinableClient, chainId);
  }

  getProviderByChainId(chainId: Chain) {
    const chain = getChainByNetworkId(chainId);
    return new JsonRpcProvider(chain.nodeUri[0]);
  }
}
