import { ReadStream } from "fs";
import { CollectionInput } from "../../@types/graphql";

export interface SdkCollectionInput extends Omit<CollectionInput, "avatar"> {
  avatar: string | ReadStream;
}
