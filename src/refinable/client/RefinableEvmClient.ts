import { JsonRpcProvider } from "@ethersproject/providers";
import { ethers, providers, Signer } from "ethers";
import _ from "lodash";
import { Chain, NFTBuilder } from "../..";
import { getChainByNetworkId } from "../../config/chains";
import { ProviderSignerWallet } from "../../interfaces/Signer";
import { NftBuilderParams } from "../../nft/builder/IBuilder";
import {
  RefinableEvmOptions,
  RefinableOptions,
} from "../../types/RefinableOptions";
import { getSignerAndProvider } from "../../utils/singer";
import EvmAccount from "../account/EvmAccount";
import { ContractFactory } from "../ContractFactory";
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
  public options: RefinableEvmOptions = {
    gasSettings: {
      maxPriceInGwei: 300, // Maximum gas price for transactions (default 300 gwei)
      speed: "fastest", // the tx speed setting: 'standard'|'fast|'fastest' (default: 'fastest')
    },
  };
  public contracts: Contracts;
  public contractFactory: ContractFactory;
  public providerOrSigner?: ProviderSignerWallet;
  public _provider?: providers.Provider;
  public _signer?: ethers.Signer;

  async init() {
    await this.contracts.initialize();
  }

  get provider() {
    if (!this._provider)
      throw new Error("Provider not set, please connect() provider first");
    return this._provider;
  }

  get signer() {
    if (!this._signer)
      throw new Error("Signer not set, please connect() provider first");
    return this._signer;
  }

  constructor(
    options: RefinableOptions,
    private readonly refinableClient: Refinable
  ) {
    this.options = _.merge(this.options, options.evm);

    this.account = new EvmAccount(refinableClient);
    this.contracts = new Contracts(refinableClient);
    this.contractFactory = new ContractFactory(refinableClient);
  }

  connect(providerOrSigner: ProviderSignerWallet) {
    const [signer, provider] = getSignerAndProvider(providerOrSigner);

    this.providerOrSigner = providerOrSigner;
    this._provider = provider;
    this._signer = signer;
  }

  disconnect() {
    this.providerOrSigner = null;
    this._provider = null;
    this._signer = null;
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
