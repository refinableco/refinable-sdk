import { GraphQLClient } from "graphql-request";
import { RefinableOptions } from "./types/RefinableOptions";

export class RefinableBase {
    protected _apiClient?: GraphQLClient;
    protected _options: RefinableOptions;
    protected _apiKey: string;
  
    get apiKey() {
      return this._apiKey;
    }
  
    get options() {
      return this._options;
    }
  
    get apiClient() {
      if (!this._apiClient) {
        throw new Error("Api Client was not initialized");
      }
      return this._apiClient;
    }
  
    set apiClient(apiClient) {
      this._apiClient = apiClient;
    }
  }