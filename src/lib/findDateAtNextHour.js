import debug from 'debug';
import dayjs from 'dayjs';

const dlog = debug('that:api:sessions:find-date-at-next-hour');

/**
 *
 * @param {*} hour - the next occurance hour to find from now
 * @returns {Date} - date of the next instance of provided hour
 */
export function findDateAtNextHour(hour) {
  dlog('finding date of next occurance of %s', hour);
  const findHour = Number.parseInt(hour, 10);
  let findHourDate = dayjs().hour(findHour).startOf('hour');
  if (dayjs() > findHourDate) {
    findHourDate = findHourDate.add(1, 'day');
  }

  return findHourDate.toDate();
}
