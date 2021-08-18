import { ReadStream } from "fs";
import { UPLOAD } from "./mint";
import { GRAPHQL_URL } from "../constants";
import { request } from "graphql-request";

export const uploadFile = async (fileStream: ReadStream, apiKey: string) => {
  const response = await request(
    GRAPHQL_URL,
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
