const LUBUMBASHI_TIME_ZONE = 'Africa/Lubumbashi';

function toSqlDateTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  // MariaDB receives DATETIME values in the connection's +02:00 local time.
  // Formatting the UTC ISO value directly made short-lived tokens expire two
  // hours early in Lubumbashi.  Build the SQL literal in that same zone.
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: LUBUMBASHI_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function addMinutes(value, minutes) {
  const date = new Date(value);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date;
}

module.exports = { toSqlDateTime, addDays, addMinutes };
