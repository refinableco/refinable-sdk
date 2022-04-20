import {
  CreatePurchaseSessionFilterInput,
  CreatePurchaseSessionInput,
  CreatePurchaseSessionMutation,
  CreatePurchaseSessionMutationVariables,
} from "../../@types/graphql";
import { CREATE_PURCHASE_SESSION } from "../../graphql/checkout";
import { RefinableBaseClient } from "../RefinableBaseClient";

export class CheckoutClient {
  constructor(private readonly refinableClient: RefinableBaseClient) {}

  async create(
    input: Pick<CreatePurchaseSessionInput, "successUrl" | "cancelUrl"> &
      CreatePurchaseSessionFilterInput
  ) {
    const { successUrl, cancelUrl, ...filter } = input;

    const response = await this.refinableClient.apiClient.request<
      CreatePurchaseSessionMutation,
      CreatePurchaseSessionMutationVariables
    >(CREATE_PURCHASE_SESSION, {
      input: {
        successUrl,
        cancelUrl,
        filter: filter as CreatePurchaseSessionFilterInput,
      },
    });

    return response?.createPurchaseSession;
  }
}
