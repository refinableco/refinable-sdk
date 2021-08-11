export const optionalParam = <T = unknown>(shouldInclude: boolean, param: T) =>
  shouldInclude ? [param] : [];
