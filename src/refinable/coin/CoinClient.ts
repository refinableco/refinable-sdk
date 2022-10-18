import { GetCoinQuery, GetCoinQueryVariables } from "../../@types/graphql";
import { GET_COIN } from "../../graphql/coins";
import { Refinable } from "../Refinable";

interface IGetCoinParams {
  id?: string;
  coingeckoId?: string;
  name?: string;
}

export class CoinClient {
  constructor(private readonly refinable: Refinable) {}

  public async getCoin({
    id,
    coingeckoId,
    name,
    chainId,
  }: IGetCoinParams & { chainId: number }) {
    let input: IGetCoinParams = {};
    if (id) {
      input.id = id;
    } else if (coingeckoId) {
      input.coingeckoId = coingeckoId;
    } else if (name) {
      input.name = name;
    }

    const queryResponse = await this.refinable.graphqlClient.request<
      GetCoinQuery,
      GetCoinQueryVariables
    >(GET_COIN, {
      input,
      chainId,
    });

    return queryResponse?.coin ?? null;
  }
}
