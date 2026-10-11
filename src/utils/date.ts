import dayjs from 'dayjs';

/** Date format used by the backend dynamic date conditions */
const DATE_FORMAT = 'YYYY-MM-DD';

/** Today as a `YYYY-MM-DD` string */
export function getToday() {
  return dayjs().format(DATE_FORMAT);
}

/** `[start, end]` of today, for a "today" default date filter */
export function getTodayRange(): [string, string] {
  const today = getToday();

  return [today, today];
}

/** `[start, end]` of the last year, for a "recent year" default date filter */
export function getLastYearRange(): [string, string] {
  return [dayjs().subtract(1, 'year').format(DATE_FORMAT), getToday()];
}
