import { ReadStream } from "fs";
import { UPLOAD } from "./mint";
import { request } from "graphql-request";

export const uploadFile = async (fileStream: ReadStream, apiKey: string) => {
  const graphqlUrl =
    process.env.GRAPHQL_URL ?? "https://api.refinable.com/graphql";

  const response = await request(
    graphqlUrl,
    UPLOAD,
    {
      file: fileStream,
    },
    {
      "X-API-KEY": apiKey,
    }
  );

  return response;
};
