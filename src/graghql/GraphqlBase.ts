import crossFetch from "cross-fetch";

export class GraphqlBase {
  private _url: string;

  constructor(url: string) {
    this._url = url;
  }

  public async _mutate({
    variables,
    query,
    authentication,
  }: {
    variables: any;
    query: any;
    authentication?: string;
  }) {
    try {
      const res = await this._fetch({
        query,
        variables,
        authentication,
      });
      return res;
    } catch (err) {
      console.error("_mutate", err);
    }
  }

  public async _query({
    variables,
    query,
    authentication,
  }: {
    variables: any;
    query: any;
    authentication?: string;
  }) {
    try {
      const res = await this._fetch({
        query,
        variables,
        authentication,
      });
      return res;
    } catch (err) {
      console.error("_query", err);
    }
  }

  private async _fetch({
    query,
    variables,
    authentication,
  }: {
    query: any;
    variables: any;
    authentication?: string;
  }) {
    try {
      const res: any = await crossFetch(this._url, {
        method: "POST",
        headers: {
          sdk: "1",
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authentication}`,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await res.json();
      return result;
    } catch (err) {
      console.error("_fetch", err);
    }
  }
}
