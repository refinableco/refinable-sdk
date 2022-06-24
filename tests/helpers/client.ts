import { Environment, Refinable } from "../../src";
import { ClientType } from "../../src/refinable/Refinable";
import { mockProperty } from "./mock";

const CONNECTION = { getBalance: jest.fn() };
const PROVIDER = {
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
  refinable.connect(ClientType.Evm, PROVIDER);

  mockProperty(refinable, "accountAddress", address);
  mockProperty(refinable, "provider", PROVIDER as any);
  mockProperty(refinable, "apiClient", API_CLIENT as any);
  mockProperty(refinable, "evm", {
    contracts: CONTRACTS,
    options: { waitConfirmations: 5 },
  } as any);

  return refinable;
};

export const getMockRefinableSolanaClient = (address: string) => {
  const refinable = new Refinable("TEST", { environment: Environment.Local });
  refinable.connect(ClientType.Solana, PROVIDER);

  mockProperty(refinable, "accountAddress", address);
  mockProperty(refinable, "provider", PROVIDER as any);
  mockProperty(refinable, "apiClient", API_CLIENT as any);
  mockProperty(refinable, "solana", { connection: CONNECTION } as any);

  return refinable;
};
