import { Chain } from "..";
import { Environment } from "../types/RefinableOptions";

export const solanaChainIds = {
  [Environment.Mainnet]: Chain.SolanaMainnetBeta,
  [Environment.Testnet]: Chain.SolanaTestnet,
  [Environment.Local]: Chain.SolanaLocalnet,
};

export const solanaAuctionHouseAuthority = {
  [Chain.SolanaMainnetBeta]: "D2ZdSnjC7NFzvZPcCRNYCqgeU5dSD1p9SLirL958zTi1",
  [Chain.SolanaDevnet]: "69agk8yEim9TUh4G26u5nEeg6eYT4Spma9xwuhAQtEPF",
  [Chain.SolanaTestnet]: "69agk8yEim9TUh4G26u5nEeg6eYT4Spma9xwuhAQtEPF",
  [Chain.SolanaLocalnet]: "69agk8yEim9TUh4G26u5nEeg6eYT4Spma9xwuhAQtEPF",
};
