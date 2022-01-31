import { RefinableEvmClient, RefinableSolanaClient } from "../../src";
import { mockProperty } from "./mock";

const CONNECTION = { getBalance: jest.fn() };
const PROVIDER = { getBalance: jest.fn() };
const API_CLIENT = { request: jest.fn() };
const CONTRACTS = {
  getMintableTokenContract: jest.fn(),
  getDefaultTokenContract: jest.fn(),
};

export const getMockRefinableEvmClient = (address: string) => {
  const refinable = new RefinableEvmClient(PROVIDER as any, address, {
    apiOrBearerToken: "TEST",
  });

  mockProperty(refinable, "provider", PROVIDER as any);
  mockProperty(refinable, "apiClient", API_CLIENT as any);
  mockProperty(refinable, "contracts", CONTRACTS as any);

  return refinable;
};

export const getMockRefinableSolanaClient = (address: string) => {
  const refinable = new RefinableSolanaClient({} as any, address, {
    apiOrBearerToken: "TEST",
  });

  mockProperty(refinable, "provider", PROVIDER as any);
  mockProperty(refinable, "apiClient", API_CLIENT as any);
  mockProperty(refinable, "connection", CONNECTION as any);

  return refinable;
};
