import { Contract } from "./Contract";

export abstract class WhitelistContract extends Contract {
  // **** TX ****

  addMinter(account: string) {
    return this.contractWrapper.sendTransaction("addMinter", [account]);
  }

  addMinterBatch(accounts: string[]) {
    return this.contractWrapper.sendTransaction("addMinterBatch", [accounts]);
  }
}
