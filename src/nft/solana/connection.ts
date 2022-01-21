import { Connection, Wallet } from "@metaplex/js";
import {
  Blockhash,
  Commitment,
  FeeCalculator,
  Keypair,
  SignatureStatus,
  SimulatedTransactionResponse,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";

export enum SequenceType {
  Sequential,
  Parallel,
  StopOnFailure,
}

export interface TxSets {
  instructions: TransactionInstruction[][];
  signers: Keypair[][];
}

export const sendTransactions = async (
  connection: Connection,
  wallet: Wallet,
  instructionSet: TransactionInstruction[][],
  signersSet: Keypair[][],
  sequenceType: SequenceType = SequenceType.Parallel,
  commitment: Commitment = "singleGossip",
  successCallback: (txid: string, ind: number) => void = (txid, ind) => {},
  failCallback: (reason: string, ind: number) => boolean = (txid, ind) => false,
  block?: { blockhash: Blockhash; feeCalculator: FeeCalculator }
): Promise<{ failedAt?: number; lastTxId?: string; txIds?: string[] }> => {
  const unsignedTxns: Transaction[] = [];

  if (!block) {
    block = await connection.getRecentBlockhash(commitment);
  }

  for (let i = 0; i < instructionSet.length; i++) {
    const instructions = instructionSet[i];
    const signers = signersSet[i];

    if (instructions.length === 0) {
      continue;
    }

    let transaction = new Transaction({
      feePayer: wallet.publicKey,
      recentBlockhash: block.blockhash,
    });
    instructions.forEach((instruction) => transaction.add(instruction));

    if (signers.length > 0) {
      transaction.partialSign(...signers);
    }

    unsignedTxns.push(transaction);
  }

  const signedTxns = await wallet.signAllTransactions(unsignedTxns);

  const pendingTxns: Promise<{ txid: string; slot: number }>[] = [];

  let breakEarlyObject = { breakEarly: false, i: 0 };
  console.log(
    "Signed txns length",
    signedTxns.length,
    "vs handed in length",
    instructionSet.length
  );
  const txIds = [];
  for (let i = 0; i < signedTxns.length; i++) {
    const signedTxnPromise = sendSignedTransaction({
      connection,
      signedTransaction: signedTxns[i],
    });

    signedTxnPromise
      .then(({ txid, slot }) => {
        successCallback(txid, i);

        txIds.push(txid);

        return txid;
      })
      .catch((reason) => {
        // @ts-ignore
        failCallback(signedTxns[i], i);
        if (sequenceType === SequenceType.StopOnFailure) {
          breakEarlyObject.breakEarly = true;
          breakEarlyObject.i = i;
        }
      });

    if (sequenceType !== SequenceType.Parallel) {
      try {
        await signedTxnPromise;
      } catch (e) {
        console.log("Caught failure", e);
        if (breakEarlyObject.breakEarly) {
          console.log("Died on ", breakEarlyObject.i);
          return {
            failedAt: breakEarlyObject.i,
            txIds,
          };
        }
      }
    } else {
      pendingTxns.push(signedTxnPromise);
    }
  }

  return { txIds, lastTxId: txIds[txIds.length - 1] };
};

export const getUnixTs = () => {
  return new Date().getTime() / 1000;
};

const DEFAULT_TIMEOUT = 15000;

export async function sendSignedTransaction({
  signedTransaction,
  connection,
  timeout = DEFAULT_TIMEOUT,
}: {
  signedTransaction: Transaction;
  connection: Connection;
  sendingMessage?: string;
  sentMessage?: string;
  successMessage?: string;
  timeout?: number;
}): Promise<{ txid: string; slot: number }> {
  const rawTransaction = signedTransaction.serialize();
  const startTime = getUnixTs();
  let slot = 0;
  const txid: TransactionSignature = await connection.sendRawTransaction(
    rawTransaction,
    {
      skipPreflight: true,
    }
  );

  connection;

  console.log("Started awaiting confirmation for", txid);

  let done = false;
  (async () => {
    while (!done && getUnixTs() - startTime < timeout) {
      connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      await sleep(500);
    }
  })();
  try {
    const confirmation = await awaitTransactionSignatureConfirmation(
      txid,
      timeout,
      connection,
      "recent",
      true
    );

    if (!confirmation)
      throw new Error("Timed out awaiting confirmation on transaction");

    if (confirmation.err) {
      console.error(confirmation.err);
      throw new Error("Transaction failed: Custom instruction error");
    }

    slot = confirmation?.slot || 0;
  } catch (err: any) {
    console.error("Timeout Error caught", err);
    if (err.timeout) {
      throw new Error("Timed out awaiting confirmation on transaction");
    }
    let simulateResult: SimulatedTransactionResponse | null = null;
    try {
      simulateResult = (await connection.simulateTransaction(signedTransaction))
        .value;
    } catch (e) {}
    if (simulateResult && simulateResult.err) {
      if (simulateResult.logs) {
        for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
          const line = simulateResult.logs[i];
          if (line.startsWith("Program log: ")) {
            throw new Error(
              "Transaction failed: " + line.slice("Program log: ".length)
            );
          }
        }
      }
      throw new Error(JSON.stringify(simulateResult.err));
    }
    // throw new Error('Transaction failed');
  } finally {
    done = true;
  }

  console.log("Latency", txid, getUnixTs() - startTime);
  return { txid, slot };
}

async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature,
  timeout: number,
  connection: Connection,
  commitment: Commitment = "recent",
  queryStatus = false
): Promise<SignatureStatus | null | void> {
  let done = false;
  let status: SignatureStatus | null | void = {
    slot: 0,
    confirmations: 0,
    err: null,
  };
  let subId = 0;
  status = await new Promise(async (resolve, reject) => {
    setTimeout(() => {
      if (done) {
        return;
      }
      done = true;
      console.log("Rejecting for timeout...");
      reject({ timeout: true });
    }, timeout);
    try {
      subId = connection.onSignature(
        txid,
        (result, context) => {
          done = true;
          status = {
            err: result.err,
            slot: context.slot,
            confirmations: 0,
          };
          if (result.err) {
            console.log("Rejected via websocket", result.err);
            reject(status);
          } else {
            console.log("Resolved via websocket", result);
            resolve(status);
          }
        },
        commitment
      );
    } catch (e) {
      done = true;
      console.error("WS error in setup", txid, e);
    }
    while (!done && queryStatus) {
      // eslint-disable-next-line no-loop-func
      (async () => {
        try {
          const signatureStatuses = await connection.getSignatureStatuses([
            txid,
          ]);
          status = signatureStatuses && signatureStatuses.value[0];
          if (!done) {
            if (!status) {
              console.log("REST null result for", txid, status);
            } else if (status.err) {
              console.log("REST error for", txid, status);
              done = true;
              reject(status.err);
            } else if (!status.confirmations) {
              console.log("REST no confirmations for", txid, status);
            } else {
              console.log("REST confirmation for", txid, status);
              done = true;
              resolve(status);
            }
          }
        } catch (e) {
          if (!done) {
            console.log("REST connection error: txid", txid, e);
          }
        }
      })();
      await sleep(2000);
    }
  });

  //@ts-ignore
  if (connection._signatureSubscriptions[subId])
    connection.removeSignatureListener(subId);
  done = true;
  console.log("Returning status", status);
  return status;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
