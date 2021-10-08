export const limit = (paging: number, max: number = 100): number => {
  return paging <= max ? paging : max;
};
