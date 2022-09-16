import {
  LaunchpadDetailsInput,
  OfferType,
  Price,
  Platform,
} from "../../@types/graphql";

export enum LIST_STATUS_STEP {
  CALCULATED_STEPS = "calculated-steps",
  APPROVE = "approve",
  SIGN = "sign",
  CREATE = "create",
  DONE = "done",
}

export interface ListStatus {
  step: LIST_STATUS_STEP;
  platform: Platform;
  data: any;
}

export interface ListApproveStatus extends ListStatus {
  step: LIST_STATUS_STEP.APPROVE;
  data: {
    addressToApprove: string;
  };
}
export interface ListSignStatus extends ListStatus {
  step: LIST_STATUS_STEP.SIGN;
  data: {
    what: string; // what are we exactly signing? pass a description
    hash: string; // the hash of what we're signing so we can make the user double check and prevent MiM attacks
  };
}
export interface ListCreateStatus extends ListStatus {
  step: LIST_STATUS_STEP.CREATE;
  data: {
    chainId: number;
    tokenId: string;
    signature: string;
    type: OfferType;
    contractAddress: string;
    price: Price;
    startTime?: Date;
    endTime?: Date;
    supply: number;
    launchpadDetails: LaunchpadDetailsInput;
    blockchainId: string;
  };
}

export interface ListDoneStatus extends ListStatus {
  step: LIST_STATUS_STEP.DONE;
  data: any;
}
