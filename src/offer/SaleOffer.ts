import { Buffer } from "buffer";
import { ethers } from "ethers";
import {
  Platform,
  PurchaseItemMutation,
  PurchaseItemMutationVariables,
  PurchaseMetadata,
} from "../@types/graphql";
import { NotEnoughSupplyError } from "../errors/NotEnoughSupplyError";
import { PURCHASE_ITEM } from "../graphql/sale";
import { AbstractNFT, NFTBuyParams } from "../nft/AbstractNFT";
import { ERCSaleID } from "../nft/ERCSaleId";
import { SaleVersion } from "../nft/interfaces/SaleInfo";
import { Refinable } from "../refinable/Refinable";
import { Transaction } from "../transaction/Transaction";
import { isERC1155Item, isEVMNFT } from "../utils/is";
import { Offer, PartialOffer } from "./Offer";
import { SimulationFailedError } from "../errors";
import { simulateUnsignedTx } from "../transaction/simulate";
import EvmTransaction from "../transaction/EvmTransaction";
import { TransactionError } from "../errors/TransactionError";

interface BuyParams {
  amount?: number;
}

export class SaleOffer extends Offer {
  constructor(refinable: Refinable, offer: PartialOffer, nft: AbstractNFT) {
    super(refinable, offer, nft);
  }

  public async buy(params?: BuyParams, metadata?: PurchaseMetadata) {
    const isExternal = this._offer.platform !== Platform.Refinable;

    if (isExternal) {
      return this.externalBuy();
    }

    let supply = await this.getSupplyOnSale();

    const amount = params?.amount ?? 1;

    if (this._offer.supply - amount < 0) throw new NotEnoughSupplyError();

    const buyParams: NFTBuyParams = {
      signature: this._offer.signature,
      price: this._offer.price,
      ownerEthAddress: this._offer.user?.ethAddress,
      supply,
      blockchainId: this._offer.blockchainId,
      amount,
      endTime: this._offer.endTime,
      startTime: this._offer.startTime,
      marketConfig: this._offer.marketConfig,
    };

    let result: Transaction;

    if (this.whitelistVoucher && isEVMNFT(this.nft)) {
      result = await this.nft.buyUsingVoucher(buyParams, this.whitelistVoucher);
    } else {
      result = await this.nft.buy(buyParams);
    }

    if (metadata) {
      metadata.createdAt = new Date();
    }

    if (result.txId) {
      await this.refinable.graphqlClient.request<
        PurchaseItemMutation,
        PurchaseItemMutationVariables
      >(PURCHASE_ITEM, {
        input: {
          offerId: this._offer.id,
          amount: buyParams.amount,
          transactionHash: result.txId,
          metadata,
        },
      });

      this.subtractOfferSupply(amount);
    }

    return result;
  }

  private async externalBuy() {
    const unsignedTx = this.refinable
      .platform(this._offer.platform)
      .buy(
        this._offer,
        this.nft.getItem().contractAddress,
        this.nft.getItem().tokenId
      );

    const resp = await simulateUnsignedTx({
      refinable: this.refinable,
      data: unsignedTx.data,
      to: unsignedTx.to,
      value: unsignedTx.value,
    });

    if (resp.data.simulation.status === false) {
      throw new SimulationFailedError();
    }

    try {
      const response = await this.refinable.evm.provider.sendTransaction(
        unsignedTx
      );

      const receipt = await response.wait();
      return new EvmTransaction(receipt);
    } catch (e) {
      throw new TransactionError(e);
    }
  }

  public async cancelSale<T extends Transaction = Transaction>(): Promise<T> {
    const selling = await this.getSupplyOnSale();

    return this.nft.cancelSale({
      price: this.price,
      signature: this._offer.signature,
      selling,
      blockchainId: this._offer.blockchainId,
    }) as Promise<T>;
  }

  /**
   * We need this as a fix to support older signatures where we sent the total supply rather than the offer supply
   */
  private async getSupplyOnSale() {
    if (isERC1155Item(this.nft)) {
      const saleID = ERCSaleID.fromBlockchainId(this._offer.blockchainId);

      const saleParamsWithOfferSupply = await this.nft.getSaleParamsHash({
        price: this.price,
        ethAddress: this._offer.user?.ethAddress,
        supply: this._offer.totalSupply,
        endTime: this._offer.endTime,
        startTime: this._offer.startTime,
        isV2: saleID?.version === SaleVersion.V2,
      });

      const address = ethers.utils.verifyMessage(
        // For some reason we need to remove 0x and parse it as buffer for it to work
        Buffer.from(saleParamsWithOfferSupply.slice(2), "hex"),
        this._offer.signature
      );

      return address.toLowerCase() ===
        this._offer.user?.ethAddress.toLowerCase()
        ? this._offer.totalSupply
        : this.nft.getItem().totalSupply;
    }

    return this._offer.totalSupply;
  }
}
