export interface Transaction {
  txId: string;
  timestamp?: number;
  success: boolean;
  // This function waits until the transaction has been mined
  wait: (confirmations?: number) => Promise<Transaction>;
}
