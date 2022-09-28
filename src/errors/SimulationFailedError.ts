export class SimulationFailedError extends Error {
  public _isSimulationFailedError = true;

  constructor(message: string = "") {
    super(`Simulation Failed: ${message}`);
    this.name = this.constructor.name;

    // Not supported in some browsers
    if (typeof Error.captureStackTrace === "function")
      Error.captureStackTrace(this, this.constructor);
  }
}

export const isSimulationFailedError = (error: Error) => {
  return (
    error instanceof SimulationFailedError ||
    Boolean((error as SimulationFailedError)._isSimulationFailedError) === true
  );
};
