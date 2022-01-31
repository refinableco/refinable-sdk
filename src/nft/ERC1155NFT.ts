import { ethers } from "ethers";
import {
  CreateOfferForEditionsMutation,
  CreateOfferForEditionsMutationVariables,
  OfferType,
  Price,
  TokenType,
} from "../@types/graphql";
import { CREATE_OFFER } from "../graphql/sale";
import { SaleOffer } from "../offer/SaleOffer";
import { RefinableEvmClient } from "../refinable/RefinableEvmClient";
import EvmTransaction from "../transaction/EvmTransaction";
import { optionalParam } from "../utils/utils";
import { AbstractEvmNFT } from "./AbstractEvmNFT";
import { PartialNFTItem } from "./AbstractNFT";

export class ERC1155NFT extends AbstractEvmNFT {
  constructor(refinable: RefinableEvmClient, item: PartialNFTItem) {
    super(TokenType.Erc1155, refinable, item);
  }

  async approve(operatorAddress: string): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    const setApprovalForAllTx = await nftTokenContract.setApprovalForAll(
      operatorAddress,
      true
    );

    return new EvmTransaction(setApprovalForAllTx);
  }

  async isApproved(operatorAddress: string): Promise<boolean> {
    const nftTokenContract = await this.getTokenContract();

    return nftTokenContract.isApprovedForAll(
      this.refinable.accountAddress,
      operatorAddress
    );
  }

  async buy(params: {
    signature?: string;
    price: Price;
    ownerEthAddress: string;
    royaltyContractAddress?: string;
    supply?: number;
    amount?: number;
  }): Promise<EvmTransaction> {
    const {
      signature,
      price: pricePerCopy,
      ownerEthAddress,
      royaltyContractAddress,
      supply = 1,
      amount = 1,
    } = params;

    this.verifyItem();
    await this.isValidRoyaltyContract(royaltyContractAddress);
    const saleContract = await this.refinable.contracts.getRefinableContract(
      this.item.chainId,
      this.saleContract.address
    );
    const isDiamondContract = saleContract.hasTagSemver("SALE", ">=4.0.0");

    const priceWithServiceFee = await this.getPriceWithBuyServiceFee(
      pricePerCopy,
      this.saleContract.address,
      amount
    );

    await this.approveForTokenIfNeeded(
      priceWithServiceFee,
      this.saleContract.address
    );

    const paymentToken = this.getPaymentToken(pricePerCopy.currency);
    const isNativeCurrency = this.isNativeCurrency(pricePerCopy.currency);
    const value = this.parseCurrency(
      pricePerCopy.currency,
      priceWithServiceFee.amount
    );

    const buyTx = await this.saleContract.buy(
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
      supply,
      // uint256 _buying
      amount,
      // bytes memory _signature
      signature,
      // If currency is Native, send msg.value
      ...optionalParam(isNativeCurrency, {
        value,
      })
    );

    return new EvmTransaction(buyTx);
  }

  async putForSale(price: Price, supply = 1): Promise<SaleOffer> {
    this.verifyItem();

    const addressForApproval = this.transferProxyContract.address;

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
  ): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    const transferTx = await nftTokenContract.safeTransferFrom(
      ownerEthAddress,
      recipientEthAddress,
      this.item.tokenId,
      amount,
      ethers.constants.HashZero
    );

    return new EvmTransaction(transferTx);
  }

  async burn(amount: number, ownerEthAddress: string): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    const burnTx = await nftTokenContract.burn(
      ownerEthAddress,
      this.item.tokenId,
      amount
    );

    return new EvmTransaction(burnTx);
  }
}
