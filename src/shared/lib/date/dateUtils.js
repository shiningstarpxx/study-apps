export function toDateKey(input = new Date()) {
  return new Date(input).toISOString().split('T')[0];
}

export function getTodayDateKey() {
  return toDateKey(new Date());
}

export function getOffsetDateKey(offsetDays, baseDate = new Date()) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + offsetDays);
  return toDateKey(date);
}
