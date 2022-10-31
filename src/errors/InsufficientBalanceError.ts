export class InsufficientBalanceError extends Error {
  constructor(supply: number = 0) {
    super(
      `You do not have enough of this token to perform this action. ${
        supply > 0 ? `Your balance is ${supply}` : ""
      } `
    );
    this.name = this.constructor.name;

    // Not supported in some browsers
    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, this.constructor);
  }
}
