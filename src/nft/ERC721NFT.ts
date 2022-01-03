/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
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
import { AbstractNFT, PartialNFTItem } from "./AbstractNFT";
import { optionalParam } from "../utils/utils";
import { ethers } from "ethers";

export class ERC721NFT extends AbstractNFT {
  constructor(refinable: Refinable, item: PartialNFTItem) {
    super(TokenType.Erc721, refinable, item);
  }

  async approve(operatorAddress: string): Promise<TransactionResponse> {
    const nftTokenContract = await this.getTokenContract();

    // TODO: we should actually use this but our contracts do not support it
    // return this.nftTokenContract.approve(operatorAddress, this.item.tokenId);
    return nftTokenContract.setApprovalForAll(operatorAddress, true);
  }

  async isApproved(operatorAddress: string) {
    const nftTokenContract = await this.getTokenContract();

    // TODO: we should actually use this but our contracts do not support it
    // const approvedSpender = await this.nftTokenContract.getApproved(this.item.tokenId);
    const isApprovedForAll = await nftTokenContract.isApprovedForAll(
      this.refinable.accountAddress,
      operatorAddress
    );

    // return approvedSpender.toLowerCase() === operatorAddress.toLowerCase() || isApprovedForAll;
    return isApprovedForAll;
  }

  async buy(
    signature: string,
    price: Price,
    ownerEthAddress: string,
    royaltyContractAddress?: string
  ): Promise<TransactionResponse> {
    this.verifyItem();

    const saleContract = await this.refinable.contracts.getRefinableContract(
      this.item.chainId,
      this.saleContract.address
    );
    await this.isValidRoyaltyContract(royaltyContractAddress);
    const isDiamondContract =
      saleContract?.tags?.[0] === ContractTag.SaleV4_0_0;

    await this.isValidRoyaltyContract(royaltyContractAddress);

    const priceWithServiceFee = await this.getPriceWithBuyServiceFee(
      price,
      this.saleContract.address
    );

    await this.approveForTokenIfNeeded(
      priceWithServiceFee,
      this.saleContract.address
    );

    const paymentToken = this.getPaymentToken(price.currency);
    const isNativeCurrency = this.isNativeCurrency(price.currency);
    const value = this.parseCurrency(
      price.currency,
      priceWithServiceFee.amount
    );

    const result = isDiamondContract
      ? await this.saleContract.buy(
          // address _token
          this.item.contractAddress,
          // uint256 _tokenId
          this.item.tokenId,
          // address _payToken
          paymentToken,
          // address payable _owner
          ownerEthAddress,
          // bytes memory _signature
          signature,
          // If currency is native, send msg.value
          ...optionalParam(isNativeCurrency, {
            value,
          })
        )
      : await this.saleContract.buy(
          // address _token
          this.item.contractAddress,
          // address _royaltyToken,
          royaltyContractAddress ?? ethers.constants.AddressZero,
          // uint256 _tokenId
          this.item.tokenId,
          // address _payToken
          paymentToken,
          // address payable _owner
          ownerEthAddress,
          // bytes memory _signature
          signature,
          // If currency is native, send msg.value
          ...optionalParam(isNativeCurrency, {
            value,
          })
        );

    return result;
  }

  async putForSale(price: Price): Promise<SaleOffer> {
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

    const saleParamsHash = await this.getSaleParamsHash(
      price,
      this.refinable.accountAddress
    );

    const signedHash = await this.refinable.personalSign(
      saleParamsHash as string
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
        supply: 1,
      },
    });

    return this.refinable.createOffer<OfferType.Sale>(
      { ...result.createOfferForItems, type: OfferType.Sale },
      this
    );
  }

  async transfer(
    ownerEthAddress: string,
    recipientEthAddress: string
  ): Promise<TransactionResponse> {
    const nftTokenContract = await this.getTokenContract();

    // the method is overloaded, generally this is the one we want to use
    return nftTokenContract["safeTransferFrom(address,address,uint256)"](
      ownerEthAddress,
      recipientEthAddress,
      this.item.tokenId
    );
  }

  async burn(): Promise<TransactionResponse> {
    const nftTokenContract = await this.getTokenContract();

    return nftTokenContract.burn(this.item.tokenId);
  }

  async cancelSale(
    price?: Price,
    signature?: string
  ): Promise<TransactionResponse> {
    if (!this.item.tokenId) {
      throw new Error("tokenId is not set");
    }

    if (!this.item.contractAddress) {
      throw new Error("contract address is not set");
    }
    this.verifyItem();
    const saleContract = await this.refinable.contracts.getRefinableContract(
      this.item.chainId,
      this.saleContract.address
    );
    const isDiamondContract =
      saleContract?.tags?.[0] === ContractTag.SaleV4_0_0;

    if (isDiamondContract) {
      const paymentToken = this.getPaymentToken(price.currency);
      const parsedPrice = this.parseCurrency(price.currency, price.amount);
      return await this.saleContract.cancel(
        this.item.contractAddress,
        this.item.tokenId,
        paymentToken,
        parsedPrice.toString(),
        signature
      );
    } else {
      return await this.saleContract.cancel(
        this.item.contractAddress,
        this.item.tokenId
      );
    }
  }
}
