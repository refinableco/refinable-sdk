import {
  RefinableEvmOptions,
  RefinableOptions,
  RefinableSolanaOptions,
} from "../types/RefinableOptions";
import { RefinableEvmClient } from "./RefinableEvmClient";
import { RefinableSolanaClient } from "./RefinableSolanaClient";
import merge from "merge-options-default";
import omit from "lodash.omit";

export enum ClientType {
  Solana = "Solana",
  Evm = "Evm",
}

export const clientTypeMap = {
  [ClientType.Solana]: RefinableSolanaClient,
  [ClientType.Evm]: RefinableEvmClient,
};

export type ClientMapType = typeof clientTypeMap;
type Tuples<T> = T extends ClientType
  ? [T, InstanceType<ClientMapType[T]>]
  : never;
export type SingleKeys<K> = [K] extends (K extends ClientType ? [K] : never)
  ? K
  : never;
type ClassType<A extends ClientType, F> =
  | Extract<Tuples<ClientType>, [A, any]>[1]
  | F;

export class Refinable {
  public static async create<K extends ClientType>(
    type: SingleKeys<K>,
    provider: any,
    apiOrBearerToken: string,
    options: RefinableOptions & {
      evm?: RefinableEvmOptions;
      solana?: RefinableSolanaOptions;
    } = {}
  ): Promise<ClassType<K, never>> {
    const Client = clientTypeMap[type];

    const optionsForClient = options[type.toLowerCase()];

    return Client.create(
      provider,
      apiOrBearerToken,
      merge(optionsForClient, omit(options, ["evm", "solana"]))
    );
  }
}
