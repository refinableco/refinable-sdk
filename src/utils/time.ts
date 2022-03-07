export function getUnixEpochTimeStampFromDate(value: Date) {
  if (typeof value === "string") value = new Date(value);
  return Math.floor(value.getTime() / 1000);
}

export function getUnixEpochTimeStampFromDateOr0(value?: Date) {
  if (!value) return 0;
  return getUnixEpochTimeStampFromDate(value);
}
