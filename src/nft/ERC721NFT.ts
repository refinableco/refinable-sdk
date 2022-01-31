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

export class ERC721NFT extends AbstractEvmNFT {
  constructor(refinable: RefinableEvmClient, item: PartialNFTItem) {
    super(TokenType.Erc721, refinable, item);
  }

  async approve(operatorAddress: string): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    // TODO: we should actually use this but our contracts do not support it
    // return this.nftTokenContract.approve(operatorAddress, this.item.tokenId);
    const setApprovalForAllTx = await nftTokenContract.setApprovalForAll(
      operatorAddress,
      true
    );

    return new EvmTransaction(setApprovalForAllTx);
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

  async buy(params: {
    signature?: string;
    price: Price;
    ownerEthAddress: string;
    royaltyContractAddress?: string;
  }): Promise<EvmTransaction> {
    const { royaltyContractAddress, price, ownerEthAddress, signature } =
      params;

    this.verifyItem();

    const saleContract = await this.refinable.contracts.getRefinableContract(
      this.item.chainId,
      this.saleContract.address
    );
    await this.isValidRoyaltyContract(royaltyContractAddress);
    const isDiamondContract = saleContract.hasTagSemver("SALE", ">=4.0.0");

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

    const buyTx = await this.saleContract.buy(
      // address _token
      this.item.contractAddress,
      // address _royaltyToken,
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
      // bytes memory _signature
      signature,
      // If currency is native, send msg.value
      ...optionalParam(isNativeCurrency, {
        value,
      })
    );

    return new EvmTransaction(buyTx);
  }

  async putForSale(price: Price): Promise<SaleOffer> {
    this.verifyItem();
    const addressForApproval = this.transferProxyContract.address;

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
  ): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    // the method is overloaded, generally this is the one we want to use
    const transferTx = await nftTokenContract[
      "safeTransferFrom(address,address,uint256)"
    ](ownerEthAddress, recipientEthAddress, this.item.tokenId);

    return new EvmTransaction(transferTx);
  }

  async burn(): Promise<EvmTransaction> {
    const nftTokenContract = await this.getTokenContract();

    const burnTx = await nftTokenContract.burn(this.item.tokenId);

    return new EvmTransaction(burnTx);
  }
}
