import { OfferType, RefinableEvmClient, SaleOffer } from "../..";
import {
  CreateOfferForEditionsMutation,
  CreateOfferForEditionsMutationVariables,
  Price,
} from "../../@types/graphql";
import { CREATE_OFFER } from "../../graphql/sale";
import { getUnixEpochTimeStampFromDate } from "../../utils/time";
import { AbstractEvmNFT } from "../AbstractEvmNFT";

export enum WHITELIST_TYPE {
  VIP = 0,
  PRIVATE = 1,
}

export class NFTBatchBuilder<NFTClass extends AbstractEvmNFT = AbstractEvmNFT> {
  constructor(
    private readonly items: NFTClass[],
    private readonly refinable: RefinableEvmClient
  ) {
    if (this.items.length === 0) {
      throw new Error("No items were passed");
    }
  }

  async putForSale(
    price: Price,
    launchpadDetails?: {
      vipStartDate: Date;
      privateStartDate: Date;
      publicStartDate: Date;
    }
  ): Promise<SaleOffer[]> {
    if (launchpadDetails) {
      const saleInfoResponse =
        await this.items[0].saleContract.batchSetSaleInfo(
          // address[] _token
          this.items.map((item) => item.getItem().contractAddress),
          // uint256[] _tokenId
          this.items.map((item) => item.getItem().tokenId),
          // uint256 vip sale date
          getUnixEpochTimeStampFromDate(launchpadDetails.vipStartDate),
          // uint256 private sale date
          getUnixEpochTimeStampFromDate(launchpadDetails.privateStartDate),
          // uint256 public sale date
          getUnixEpochTimeStampFromDate(launchpadDetails.publicStartDate)
        );
      await saleInfoResponse.wait(this.refinable.options.waitConfirmations);
    }

    const responses = await Promise.allSettled(
      this.items.map(async (item) => {
        item.verifyItem();

        const addressForApproval = item.transferProxyContract.address;

        await item.approveIfNeeded(addressForApproval);

        const saleParamsHash = await item.getSaleParamsHash(
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
            tokenId: item.getItem().tokenId,
            signature: signedHash,
            type: OfferType.Sale,
            contractAddress: item.getItem().contractAddress,
            price: {
              currency: price.currency,
              amount: parseFloat(price.amount.toString()),
            },
            supply: 1,
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
          item
        ) as SaleOffer;
      })
    );

    const rejectedResponses = responses.filter(
      (response) => response.status === "rejected"
    );
    if (rejectedResponses.length > 0) {
      console.log("Something went wrong putting a batch of items for sale");
      console.log(rejectedResponses);
    }

    return responses
      .filter((response) => response.status === "fulfilled")
      .map((response: PromiseFulfilledResult<any>) => response.value);
  }

  async launchpadWhitelist(types: WHITELIST_TYPE[], addresses: string[][]) {
    const saleIds = await this.items[0].saleContract.getIDBatch(
      this.items.map(() => this.refinable.accountAddress),
      this.items.map((item) => item.getItem().contractAddress),
      this.items.map((item) => item.getItem().tokenId)
    );

    await this.items[0].saleContract.toggleAddressByBatch(
      saleIds,
      saleIds.map(() => types),
      saleIds.map(() => addresses),
      true
    );
    return true;
  }
}
