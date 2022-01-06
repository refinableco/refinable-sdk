/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { Buffer } from "buffer";
import { ethers } from "ethers";
import {
  ContractTag,
  CreateOfferForEditionsMutation,
  CreateOfferForEditionsMutationVariables,
  OfferType,
  Price,
  TokenType,
} from "../@types/graphql";
import { CREATE_OFFER } from "../graphql/sale";
import { SaleOffer } from "../offer/SaleOffer";
import { Refinable } from "../Refinable";
import { optionalParam } from "../utils/utils";
import { AbstractNFT, PartialNFTItem } from "./AbstractNFT";

export class ERC1155NFT extends AbstractNFT {
  constructor(refinable: Refinable, item: PartialNFTItem) {
    super(TokenType.Erc1155, refinable, item);
  }

  async approve(operatorAddress: string): Promise<TransactionResponse> {
    const nftTokenContract = await this.getTokenContract();

    return nftTokenContract.setApprovalForAll(operatorAddress, true);
  }

  async isApproved(operatorAddress: string): Promise<boolean> {
    const nftTokenContract = await this.getTokenContract();

    return nftTokenContract.isApprovedForAll(
      this.refinable.accountAddress,
      operatorAddress
    );
  }

  async buy(
    signature: string,
    pricePerCopy: Price,
    ownerEthAddress: string,
    royaltyContractAddress?: string,
    supply = 1,
    amount = 1
  ): Promise<TransactionResponse> {
    this.verifyItem();
    await this.isValidRoyaltyContract(royaltyContractAddress);
    const saleContract = await this.refinable.contracts.getRefinableContract(
      this.item.chainId,
      this.saleContract.address
    );
    const isDiamondContract =
      saleContract?.tags?.[0] === ContractTag.SaleV4_0_0;
    const priceWithServiceFee = await this.getPriceWithBuyServiceFee(
      pricePerCopy,
      this.saleContract.address,
      amount
    );

    await this.approveForTokenIfNeeded(
      priceWithServiceFee,
      this.saleContract.address
    );

    const supplyForSale = await this.getSupplyOnSale(
      pricePerCopy, // We have to take the price without service fee, since the sale signature was made that way
      supply,
      signature,
      ownerEthAddress
    );

    const paymentToken = this.getPaymentToken(pricePerCopy.currency);
    const isNativeCurrency = this.isNativeCurrency(pricePerCopy.currency);
    const value = this.parseCurrency(
      pricePerCopy.currency,
      priceWithServiceFee.amount
    );
    return await this.saleContract.buy(
      // address _token
      this.item.contractAddress,
      // address _royaltyToken
      ...optionalParam(
        !isDiamondContract,
        royaltyContractAddress ?? ethers.constants.AddressZero
      ),
      // uint256 _tokenId
      this.item.tokenId,
      // address _payToken
      paymentToken,
      // address payable _owner
      ownerEthAddress,
      // uint256 _selling
      supplyForSale,
      // uint256 _buying
      amount,
      // bytes memory _signature
      signature,
      // If currency is Native, send msg.value
      ...optionalParam(isNativeCurrency, {
        value,
      })
    );
  }

  async putForSale(price: Price, supply = 1): Promise<SaleOffer> {
    this.verifyItem();
    const contract = await this.refinable.contracts.getRefinableContract(
      this.item.chainId,
      this.saleContract.address
    );
    const isDiamond = contract?.tags?.[0] === ContractTag.SaleV4_0_0;
    const addressForApproval = isDiamond
      ? contract.contractAddress
      : this.transferProxyContract.address;

    await this.approveIfNeeded(addressForApproval);

    const saleParamHash = await this.getSaleParamsHash(
      price,
      this.refinable.accountAddress,
      supply
    );

    const signedHash = await this.refinable.personalSign(
      saleParamHash as string
    );

    const result = await this.refinable.apiClient.request<
      CreateOfferForEditionsMutation,
      CreateOfferForEditionsMutationVariables
    >(CREATE_OFFER, {
      input: {
        tokenId: this.item.tokenId,
        signature: signedHash,
        type: OfferType.Sale,
        contractAddress: this.item.contractAddress,
        price: {
          currency: price.currency,
          amount: parseFloat(price.amount.toString()),
        },
        supply,
      },
    });

    return this.refinable.createOffer<OfferType.Sale>(
      { ...result.createOfferForItems, type: OfferType.Sale },
      this
    );
  }

  async transfer(
    ownerEthAddress: string,
    recipientEthAddress: string,
    amount = 1
  ): Promise<TransactionResponse> {
    const nftTokenContract = await this.getTokenContract();

    return nftTokenContract.safeTransferFrom(
      ownerEthAddress,
      recipientEthAddress,
      this.item.tokenId,
      amount,
      ethers.constants.HashZero
    );
  }

  async burn(
    amount: number,
    ownerEthAddress: string
  ): Promise<TransactionResponse> {
    const nftTokenContract = await this.getTokenContract();

    return nftTokenContract.burn(ownerEthAddress, this.item.tokenId, amount);
  }

  /**
   * We need this as a fix to support older signatures where we sent the total supply rather than the offer supply
   */
  private async getSupplyOnSale(
    price: Price,
    offerSupply: number,
    offerSignature: string,
    ownerEthAddress: string
  ) {
    const saleParamsWithOfferSupply = await this.getSaleParamsHash(
      price,
      ownerEthAddress,
      offerSupply
    );

    const address = ethers.utils.verifyMessage(
      // For some reason we need to remove 0x and parse it as buffer for it to work
      Buffer.from(saleParamsWithOfferSupply.slice(2), "hex"),
      offerSignature
    );

    return address.toLowerCase() === ownerEthAddress.toLowerCase()
      ? offerSupply
      : this.item.totalSupply;
  }
}
