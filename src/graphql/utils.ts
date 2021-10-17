import { UPLOAD } from "./mint";
import { GraphQLClient } from "graphql-request";
import { Stream } from "form-data";
import {
  UploadFileMutation,
  UploadFileMutationVariables,
} from "../@types/graphql";

export const uploadFile = async (
  apiClient: GraphQLClient,
  fileStream: Stream
) => {
  const response = await apiClient.request<
    UploadFileMutation,
    UploadFileMutationVariables
  >(UPLOAD, {
    file: fileStream,
  });

  return response;
};
