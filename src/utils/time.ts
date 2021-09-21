export function getUnixEpochTimeStampFromDate(value: Date) {
  return Math.floor(value.getTime() / 1000);
}
