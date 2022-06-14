import { Account } from "./Account";

export interface Signer extends Account {
  sign(message: string): Promise<string>;
}
