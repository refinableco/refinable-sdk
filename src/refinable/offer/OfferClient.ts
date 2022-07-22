import { MintOffer, RefinableEvmClient } from "../..";
import {
  GetOfferQuery,
  GetOfferQueryVariables,
  GetUserOfferItemsQuery,
  GetUserOfferItemsQueryVariables,
  MintOfferFragment,
  OfferType,
} from "../../@types/graphql";
import { GET_OFFER, GET_USER_OFFER_ITEMS } from "../../graphql/items";
import { AbstractNFT } from "../../nft/AbstractNFT";
import { BasicOffer, Offer, PartialOffer } from "../../offer/Offer";
import { OfferFactory } from "../../offer/OfferFactory";
import { limit } from "../../utils/limitItems";
import { Refinable } from "../Refinable";

export class OfferClient {
  constructor(private readonly refinable: Refinable) {}

  public async createMintOffer(
    offer?: PartialOffer & MintOfferFragment
  ): Promise<MintOffer> {
    const chainId =
      offer?.chainId != null
        ? offer.chainId
        : await this.refinable.provider.getChainId();
    return new MintOffer(this.refinable, this.refinable.evm, chainId, offer);
  }

  createOffer<O extends Offer = Offer>(
    offer: PartialOffer & { type: O["type"] },
    nft: AbstractNFT
  ): O {
    return OfferFactory.createOffer<O>(this.refinable, offer, nft);
  }

  private async getItemsWithOffer(
    filter?: GetUserOfferItemsQueryVariables["filter"],
    paging = 30,
    after?: string
  ): Promise<GetUserOfferItemsQuery["user"]["itemsOnOffer"] | []> {
    const itemsPerPage = limit(paging);
    const queryResponse = await this.refinable.graphqlClient.request<
      GetUserOfferItemsQuery,
      GetUserOfferItemsQueryVariables
    >(GET_USER_OFFER_ITEMS, {
      ethAddress: this.refinable.accountAddress,
      filter,
      paging: {
        first: itemsPerPage,
        after: after,
      },
    });
    return queryResponse?.user?.itemsOnOffer ?? [];
  }

  async getItemsOnSale(
    filter?: GetUserOfferItemsQueryVariables["filter"],
    paging = 30,
    after?: string
  ): Promise<GetUserOfferItemsQuery["user"]["itemsOnOffer"]> {
    return this.getItemsWithOffer(
      { ...filter, type: OfferType.Sale },
      paging,
      after
    ) as GetUserOfferItemsQuery["user"]["itemsOnOffer"];
  }

  async getOffer<O extends BasicOffer = BasicOffer>(
    id: string,
    storeId?: string
  ): Promise<O> {
    const queryResponse = await this.refinable.graphqlClient.request<
      GetOfferQuery,
      GetOfferQueryVariables
    >(GET_OFFER, {
      id,
      storeId,
    });

    if (!queryResponse?.offer) return null;

    if (queryResponse.offer.__typename === "MintOffer") {
      return this.createMintOffer(queryResponse?.offer) as any;
    } else {
      const nft = this.refinable.createNft(queryResponse?.offer?.item);
      return OfferFactory.createOffer(
        this.refinable,
        queryResponse?.offer,
        nft
      );
    }
  }

  async getItemsOnAuction(
    filter?: GetUserOfferItemsQueryVariables["filter"],
    paging = 30,
    after?: string
  ): Promise<GetUserOfferItemsQuery["user"]["itemsOnOffer"]> {
    return this.getItemsWithOffer(
      { ...filter, type: OfferType.Auction },
      paging,
      after
    ) as GetUserOfferItemsQuery["user"]["itemsOnOffer"];
  }
}
