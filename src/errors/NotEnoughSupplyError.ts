export class NotEnoughSupplyError extends Error {
  constructor() {
    super("There is not enough supply left for this action");
    this.name = this.constructor.name;

    // Not supported in some browsers
    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, this.constructor);
  }
}
