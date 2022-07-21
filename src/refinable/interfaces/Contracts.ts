import { ReadStream } from "fs";
import { CreateCollectionInput } from "../../@types/graphql";

export interface CreateCollectionParams<T extends Record<string, unknown>>
  extends Pick<
    CreateCollectionInput,
    | "description"
    | "symbol"
    | "name"
    | "twitter"
    | "discord"
    | "instagram"
    | "telegram"
    | "website"
  > {
  avatar: string | ReadStream;
  banner?: string | ReadStream;
  contractArguments: Omit<T, "name" | "symbol">;
}
