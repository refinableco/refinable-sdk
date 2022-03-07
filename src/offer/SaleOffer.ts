import { Buffer } from "buffer";
import { ethers } from "ethers";
import {
  PurchaseItemMutation,
  PurchaseItemMutationVariables,
  PurchaseMetadata,
} from "../@types/graphql";
import { PURCHASE_ITEM } from "../graphql/sale";
import { AbstractNFT, NFTBuyParams } from "../nft/AbstractNFT";
import { ERCSaleID } from "../nft/ERCSaleId";
import { SaleVersion } from "../nft/interfaces/SaleInfo";
import {
  WhitelistType,
  WhitelistVoucherParams,
} from "../nft/interfaces/Voucher";
import { RefinableBaseClient } from "../refinable/RefinableBaseClient";
import { Transaction } from "../transaction/Transaction";
import { isERC1155Item, isEVMNFT } from "../utils/is";
import { Offer, PartialOfferInput } from "./Offer";

interface BuyParams {
  royaltyContractAddress?: string;
  amount?: number;
}

export class SaleOffer extends Offer {
  constructor(
    refinable: RefinableBaseClient,
    offer: PartialOfferInput,
    nft: AbstractNFT
  ) {
    super(refinable, offer, nft);
  }

  public async buy(params?: BuyParams, metadata?: PurchaseMetadata) {
    let supply = await this.getSupplyOnSale();    

    const buyParams: NFTBuyParams = {
      signature: this.signature,
      price: this.price,
      ownerEthAddress: this.user?.ethAddress,
      royaltyContractAddress: params?.royaltyContractAddress,
      supply,
      blockchainId: this.blockchainId,
      amount: params?.amount ?? 1,
      endTime: this.endTime,
      startTime: this.startTime,
    };

    let result: Transaction;

    if (this?.whitelistVoucher && isEVMNFT(this.nft)) {
      // Convert graphql enum (PUBLIC) to a numeric enum
      const voucher: WhitelistVoucherParams = {
        ...this.whitelistVoucher,
        whitelistType: WhitelistType[
          this.whitelistVoucher.whitelistType
        ] as unknown as WhitelistType,
      };

      result = await this.nft.buyUsingVoucher(buyParams, voucher);
    } else {
      result = await this.nft.buy(buyParams);
    }

    if (metadata) {
      metadata.createdAt = new Date();
    }

    if (result.txId) {
      await this.refinable.apiClient.request<
        PurchaseItemMutation,
        PurchaseItemMutationVariables
      >(PURCHASE_ITEM, {
        input: {
          offerId: this.id,
          amount: buyParams.amount,
          transactionHash: result.txId,
          metadata,
        },
      });
    }

    return result;
  }

  public async cancelSale<T extends Transaction = Transaction>(): Promise<T> {
    const selling = await this.getSupplyOnSale();

    return this.nft.cancelSale({
      price: this.price,
      signature: this.signature,
      selling,
      blockchainId: this.blockchainId,
    }) as Promise<T>;
  }

  /**
   * We need this as a fix to support older signatures where we sent the total supply rather than the offer supply
   */
  private async getSupplyOnSale() {
    if (isERC1155Item(this.nft)) {
      const saleID = ERCSaleID.fromBlockchainId(this.blockchainId);

      const saleParamsWithOfferSupply = await this.nft.getSaleParamsHash({
        price: this.price,
        ethAddress: this.user?.ethAddress,
        supply: this.totalSupply,
        endTime: this.endTime,
        startTime: this.startTime,
        isV2: saleID?.version === SaleVersion.V2,
      });

      const address = ethers.utils.verifyMessage(
        // For some reason we need to remove 0x and parse it as buffer for it to work
        Buffer.from(saleParamsWithOfferSupply.slice(2), "hex"),
        this.signature
      );

      return address.toLowerCase() === this.user?.ethAddress.toLowerCase()
        ? this.totalSupply
        : this.nft.getItem().totalSupply;
    }

    return this.totalSupply;
  }
}
