import { OfferFragment } from "../../@types/graphql";
import { IPrice } from "./Price";

export interface IOffer
  extends Pick<
    OfferFragment,
    | "id"
    | "type"
    | "signature"
    | "contractAddress"
    | "user"
    | "totalSupply"
    | "auction"
    | "blockchainId"
    | "startTime"
    | "endTime"
    | "whitelistStage"
    | "whitelistVoucher"
    | "launchpadDetails"
    | "marketConfig"
    | "supply"
    | "chainId"
    | "platform"
    | "orderParams"
  > {
  price: IPrice;
}
