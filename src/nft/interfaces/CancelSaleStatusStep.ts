import { Platform } from "../../@types/graphql";

export enum CANCEL_SALE_STATUS_STEP {
  CALCULATED_STEPS = "calculated-steps",
  SIGN = "sign",
  CANCELING = "canceling",
  DONE = "done",
}

export interface CancelSaleStatus {
  step: CANCEL_SALE_STATUS_STEP;
  platform: Platform;
  data?: any;
}

export interface CancelSaleSignStatus extends CancelSaleStatus {
  step: CANCEL_SALE_STATUS_STEP.SIGN;
  data: {
    what: string; // what are we exactly signing? pass a description
    hash: string; // the hash of what we're signing so we can make the user double check and prevent MiM attacks
  };
}
export interface CancelSaleCreateStatus extends CancelSaleStatus {
  step: CANCEL_SALE_STATUS_STEP.CANCELING;
  data: any;
}

export interface CancelSaleDoneStatus extends CancelSaleStatus {
  step: CANCEL_SALE_STATUS_STEP.DONE;
  data: any;
}
