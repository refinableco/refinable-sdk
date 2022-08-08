import { gql } from "graphql-request";

export const GET_UNSGINED_TX = gql`
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