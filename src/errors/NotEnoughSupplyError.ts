export class NotEnoughSupplyError extends Error {
  constructor() {
    super("There is not enough supply left for this action");
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}
