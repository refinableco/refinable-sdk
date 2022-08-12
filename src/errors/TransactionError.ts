import { ethers } from "ethers";
import { parseMetaMaskError } from "../utils/parse-error";

export class TransactionError extends Error {
  public reason: string;
  public data: string;
  public functionInfo: any | undefined;
  public transaction?: ethers.UnsignedTransaction;
  public originalError: Error;
  public code: string;

  constructor(originalError: any, contractInterface?: ethers.utils.Interface) {
    const parsedError = parseMetaMaskError(originalError);
    const reason = parsedError.message;
    const transaction =
      originalError["transaction"] ?? originalError.error?.["transaction"];
    const data = transaction?.["data"];

    const functionInfo =
      data?.length > 0 ? parseFunctionInfo(data, contractInterface) : undefined;

    super(reason);

    // Not supported in some browsers
    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, this.constructor);

    this.reason = reason;
    this.data = data;
    this.functionInfo = functionInfo;
    this.transaction = transaction;
    this.originalError = originalError;
    this.name = this.constructor.name;
  }
}

/**
 * Recontructs schema and input parameters based on the ABI and the input data
 * @param data
 * @param contractInterface
 * @returns
 */
function parseFunctionInfo(
  data: string,
  contractInterface: ethers.utils.Interface
): any | undefined {
  try {
    const fnFragment = contractInterface.parseTransaction({
      data,
    });
    const results: Record<string, any> = {};
    const args = fnFragment.args;
    fnFragment.functionFragment.inputs.forEach((param, index) => {
      if (Array.isArray(args[index])) {
        const obj: Record<string, unknown> = {};
        const components = param.components;
        if (components) {
          const arr = args[index];
          for (let i = 0; i < components.length; i++) {
            const name = components[i].name;
            obj[name] = arr[i];
          }
          results[param.name] = obj;
        }
      } else {
        results[param.name] = args[index];
      }
    });
    return {
      signature: fnFragment.signature,
      inputs: results,
      value: fnFragment.value,
    };
  } catch (e) {
    return undefined;
  }
}
