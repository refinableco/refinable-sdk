import { gql } from "graphql-request";

export const GET_UNSIGNED_TX = gql`
    query x2y2($data: GetUnsignedTxInput!) {
        x2y2 {
            getUnsignedTx(data: $data) {
                from
                to
                data
                value
            }
        }
    }
`;

export const POST_ORDER = gql`
    mutation x2y2PostOrder($data: LocalOrder!) {
        postOrder(data: $data)
    }
`;
