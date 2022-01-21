export interface Transaction {
  txId: string;
  timestamp?: number;
  successful: boolean;
  // This function waits until the transaction has been mined
  wait: (confirmations?: number | string) => Promise<Transaction>;
}
