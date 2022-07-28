export class SimulationFailedError extends Error {
  public _isSimulationFailedError = true;

  constructor() {
    super("Simulation Failed");
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const isSimulationFailedError = (error: Error) => {
  return (
    error instanceof SimulationFailedError ||
    Boolean((error as SimulationFailedError)._isSimulationFailedError) === true
  );
};
