export const mockProperty = <T extends {}, K extends keyof T>(
  object: T,
  property: K,
  value: any
) => {
  Object.defineProperty(object, property, { get: () => value });
};
