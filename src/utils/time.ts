export function getUnixEpochTimeStampFromDate(value: Date) {
  if (typeof value === "string") value = new Date(value);
  return Math.floor(value.getTime() / 1000);
}

export function getUnixEpochTimeStampFromDateOr0(value?: Date | string) {
  if (!value) return 0;

  let parsed = value;

  if (typeof parsed == "string") {
    parsed = new Date(parsed);
  }

  return getUnixEpochTimeStampFromDate(parsed);
}
