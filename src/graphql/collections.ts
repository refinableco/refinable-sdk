import { gql } from "graphql-request";

export const CREATE_COLLECTION = gql`
  mutation createCollection($data: CreateCollectionInput!) {
    createCollection(data: $data) {
      id
      slug
    }
  }
`;
