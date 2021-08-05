import { GraphqlBase } from "./GraphqlBase";
import { Network } from "../type";
import { TEST_GRAPHQL_URL, GRAPHQL_URL } from "../constants";

export class GraphqlCustom extends GraphqlBase {
  constructor(network: Network) {
    const url = network === Network.BCS ? GRAPHQL_URL : TEST_GRAPHQL_URL;
    super(url);
  }

  public async createOfferForEditorsMutation(
    variables: any,
    authentication: string
  ) {
    try {
      const query = `
        mutation createOfferForEditions($input: CreateOffersInput!) {
          createOfferForItems(input: $input) {
            id
          }
        }
      `;

      const res = await this._mutate({ variables, query, authentication });
      return res;
    } catch (err) {
      console.error("createOfferForEditorsMutation", err);
    }
  }

  public async verificationTokenQuery(variables: any) {
    try {
      const query = `
        query verificationToken($data: VerificationTokenInput!) {
          verificationToken(data: $data)
        }
      `;

      const res = await this._query({ variables, query });
      return res.data.verificationToken;
    } catch (err) {
      console.error("verificationTokenQuery", err);
    }
  }

  public async loginMutation(variables: any) {
    try {
      const query = `
        mutation login($data: LoginInput!) {
          login(data: $data) {
            token
          }
        }
      `;

      const res = await this._mutate({ variables, query });
      return res.data.login.token;
    } catch (err) {
      console.error("loginMutation", err);
    }
  }
}
