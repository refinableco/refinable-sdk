import { Chain } from "..";
import { Environment } from "../types/RefinableOptions";

export const solanaChainIds = {
    [Environment.Mainnet]: Chain.SolanaMainnetBeta,
    [Environment.Testnet]: Chain.SolanaTestnet,
    [Environment.Local]: Chain.SolanaLocalnet,
  };
  
  export const solanaStorePubKeys = {
    [Environment.Mainnet]: "2BTjec5VKyyk2b6Y9SLedNbozrxiDrK2uubCLAXyUBiv",
    [Environment.Testnet]: "2BTjec5VKyyk2b6Y9SLedNbozrxiDrK2uubCLAXyUBiv",
    [Environment.Local]: "2BTjec5VKyyk2b6Y9SLedNbozrxiDrK2uubCLAXyUBiv",
  };
  