import { Environment } from "../types/RefinableOptions";

export const apiUrl = {
  [Environment.Mainnet]: "https://api.refinable.com/graphql",
  [Environment.Testnet]: "https://api-testnet.refinable.com/graphql",
  [Environment.Local]: "http://localhost:8001/graphql",
};

export const ipfsUrl = {
  [Environment.Mainnet]: "https://ipfs.refinable.com/ipfs/",
  [Environment.Testnet]: "https://ipfs-testnet.refinable.com/ipfs/",
  [Environment.Local]: "http://localhost:8080/ipfs/",
};

export const SIGNERS = {
  [Environment.Mainnet]: "0xD2E49cfd5c03a72a838a2fC6bB5f6b46927e731A",
  [Environment.Testnet]: "0x9d2b8DFd7B8F33Cf84499Ac2df74896174AAb98C",
  [Environment.Local]: "0x9d2b8DFd7B8F33Cf84499Ac2df74896174AAb98C",
};


