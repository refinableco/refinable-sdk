export class ContractNotFoundError extends Error {
  public data: {
    contractAddress?: string;
    chainId: number;
    type?: string;
  };

  constructor(params: {
    contractAddress?: string;
    chainId: number;
    type?: string;
  }) {
    super("This contract could not be found");
    this.name = this.constructor.name;
    this.data = params;

    // Not supported in some browsers
    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, this.constructor);
  }
}
