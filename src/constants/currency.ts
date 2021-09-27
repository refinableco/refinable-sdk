import { PriceCurrency } from "../@types/graphql";

export interface Price {
    currency: PriceCurrency;
    amount: number;
};