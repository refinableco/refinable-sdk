import { Environment, Refinable } from "../../src";
import { mockProperty } from "./mock";

const PROVIDER = {
  _isSigner: true,
  getBalance: jest.fn(),
  getAddress: jest.fn(),
  publicKey: { toBase58: jest.fn() },
};
const API_CLIENT = { request: jest.fn() };
const CONTRACTS = {
  getMintableTokenContract: jest.fn(),
  getDefaultTokenContract: jest.fn(),
};

export const getMockRefinableClient = (address: string) => {
  const refinable = new Refinable("TEST", { environment: Environment.Local });

  mockProperty(refinable, "accountAddress", address);
  mockProperty(refinable, "provider", PROVIDER as any);
  mockProperty(refinable, "graphqlClient", API_CLIENT as any);
  mockProperty(refinable, "evm", {
    contracts: CONTRACTS,
    signer: PROVIDER,
    provider: {
      getCode: jest.fn(),
    },
  } as any);

  return refinable;
};


