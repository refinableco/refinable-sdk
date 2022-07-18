import { ReadStream } from "fs";
import { CreateCollectionInput } from "../../@types/graphql";

export interface SdkCollectionInput
  extends Omit<CreateCollectionInput, "avatar" | "banner"> {
  avatar: string | ReadStream;
  banner?: string | ReadStream;
}
