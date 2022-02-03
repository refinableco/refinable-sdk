/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { Contract, ethers } from "ethers";
import {
  ContractTypes,
  CreateOfferForEditionsMutation,
  CreateOfferForEditionsMutationVariables,
  OfferType,
  Price,
  TokenType,
} from "../@types/graphql";
import { CREATE_OFFER } from "../graphql/sale";
import { SaleOffer } from "../offer/SaleOffer";
import { Refinable } from "../Refinable";
import { getUnixEpochTimeStampFromDate } from "../utils/time";
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
      this.saleContract.address,
      [ContractTypes.Erc1155Sale]
    );
    const isDiamondContract = saleContract.hasTagSemver("SALE", ">=4.0.0");

    const priceWithServiceFee = await this.getPriceWithBuyServiceFee(
      pricePerCopy,
      this.saleContract.address,
      [ContractTypes.Erc1155Sale],
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
  }

  async putForSale(
    price: Price,
    supply = 1,
    launchpadDetails?: {
      vipStartDate: Date;
      privateStartDate: Date;
      publicStartDate: Date;
    }
  ): Promise<SaleOffer> {
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

    if (launchpadDetails) {
      const saleInfoResponse = await this.saleContract.setSaleInfo(
        // address _token
        this.item.contractAddress,
        // uint256 _tokenId
        this.item.tokenId,
        // uint256 vip sale date
        getUnixEpochTimeStampFromDate(launchpadDetails.vipStartDate),
        // uint256 private sale date
        getUnixEpochTimeStampFromDate(launchpadDetails.privateStartDate),
        // uint256 public sale date
        getUnixEpochTimeStampFromDate(launchpadDetails.publicStartDate)
      );
      await saleInfoResponse.wait(this.refinable.options.waitConfirmations);
    }

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
        ...(launchpadDetails && {
          launchpadDetails: {
            vipStartDate: launchpadDetails.vipStartDate,
            privateStartDate: launchpadDetails.privateStartDate,
            publicStartDate: launchpadDetails.publicStartDate,
          },
        }),
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
}
