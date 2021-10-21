import { gql } from "graphql-request";

export const UPLOAD = gql`
  mutation uploadFile($file: Upload!) {
    uploadFile(file: $file)
  }
`;

export const CREATE_ITEM = gql`
  mutation createItem($input: CreateItemInput!) {
    createItem(input: $input) {
      signature
      item {
        id
        tokenId
        contractAddress
        chainId
        supply
        totalSupply
        type
        properties {
          fileType
          imagePreview
          fileUrl
          ipfsUrl
          ipfsDocument
        }
      }
    }
  }
`;

export const FINISH_MINT = gql`
  mutation finishMint($input: FinishMintInput!) {
    finishMint(input: $input) {
      item {
        id
        tokenId
        contractAddress
        chainId
        supply
        totalSupply
        type
        properties {
          fileType
          imagePreview
          fileUrl
          ipfsUrl
          ipfsDocument
        }
      }
    }
  }
`;
