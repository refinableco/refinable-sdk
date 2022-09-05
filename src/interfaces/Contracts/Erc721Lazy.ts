export interface SaleSettings {
  /// @dev Max amount of NFTs to be minted per mint, 0 is infinite
  maxPerMint: number;
  /// @dev Max amount of NFTs to be minted per wallet, 0 is infinite
  maxPerWallet: number;
  
  walletLimitBypassAddress: string;
}
