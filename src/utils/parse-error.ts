import { errorCodes, getMessageFromCode } from "eth-rpc-errors";

export interface LocalError {
  identifier: string;
  message: string;
  code?: number;
}

const contractErrorCodes = [
  errorCodes.rpc.invalidInput,
  errorCodes.rpc.internal,
  "UNPREDICTABLE_GAS_LIMIT",
];

export const parseKnownMessages = (data: {
  message: string;
  code?: number;
  identifier?: string;
}): { message: string; code?: number; identifier: string } => {
  if ((data?.message ?? "").startsWith("Nonce too high.")) {
    return {
      identifier: "Metamask",
      message: "Nonce too high, you most likely have to reset your account.",
      code: data?.code,
    };
  }

  if ((data?.message ?? "").startsWith("unauthorized signature")) {
    let message = "Process failed. Please try again.";

    if (data.identifier === "MintVoucher") {
      message = "Unable to finalize this sale, it might no longer be active.";
    }

    return {
      identifier: "Metamask",
      message,
      code: data?.code,
    };
  }

  if (
    (data?.message ?? "").startsWith(
      "insufficient funds for gas * price + value"
    )
  ) {
    return {
      identifier: "Metamask",
      message: "Insufficient funds, please top up your account and try again.",
      code: data?.code,
    };
  }

  return { identifier: "Metamask", ...data };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseMetaMaskError = (metaMaskError: any): LocalError => {
  const error = JSON.parse(JSON.stringify(metaMaskError));
  const errorData = error["data"];
  const errorError = error["error"];

  let data = error;

  if (errorError?.code === "UNPREDICTABLE_GAS_LIMIT") {
    data = errorError;
  } else if (!!errorData) {
    data = errorData;
  } else if (!errorData && errorError?.["data"]) {
    data = errorError["data"];
  }

  const msg =
    data?.reason ??
    data?.message ??
    error?.message ??
    error?.error?.message ??
    "Something went wrong. Please try again later.";

  // rpc errors are special as they're wrapped, extract the value and handle that
  const rpcError = msg.match(
    /\[ethjs-query\] while formatting outputs from RPC '(.*)'/
  );
  if (rpcError?.[1]) {
    return parseMetaMaskError(JSON.parse(rpcError[1]).value);
  }

  // general message handling
  if (
    msg &&
    contractErrorCodes.includes(error?.code) &&
    !msg?.includes("Transaction reverted without a reason string")
  ) {
    const parsedError = { ...extractContractError(msg), code: data?.code };
    return parseKnownMessages(parsedError);
  } else if (data?.code && data?.code > 0) {
    // FIXME: We could translate all error codes coming from this
    // https://github.com/MetaMask/eth-rpc-errors/blob/main/src/error-constants.ts
    return parseKnownMessages({
      message: getMessageFromCode(error.code, msg),
      code: data?.code,
    });
  }

  return { identifier: "unknown", message: msg };
};

const extractContractError = (message: string) => {
  let contractMessage = message
    .replace("execution reverted: ", "")
    .replace("'", "");
  try {
    const regex =
      /.*?reverted with reason string [^a-zA-Z0-9]*(?<reason>[^'\\]*).*?/gm;
    const parsedMessage = regex.exec(message)?.groups?.reason?.trim();
    if (parsedMessage?.trim()) {
      contractMessage = parsedMessage;
    }

    // eslint-disable-next-line no-empty
  } catch {}

  const [identifier, error] = contractMessage.split(": ");

  if (!error) {
    return {
      identifier: "unknown",
      message: contractMessage,
    };
  }

  return {
    identifier,
    message: error,
  };
};
