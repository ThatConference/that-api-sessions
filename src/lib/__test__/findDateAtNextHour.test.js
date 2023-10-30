import { findDateAtNextHour } from '../findDateAtNextHour';
import dayjs from 'dayjs';
import mockDate from 'mockdate';

const tests = [
  {
    now: '2023-10-11T10:10:10',
    for: 8,
    expect: dayjs('2023-10-11T10:10:10')
      .add(1, 'day')
      .hour(8)
      .startOf('hour')
      .toDate(),
  },
  {
    now: '2023-10-11T10:10:10',
    for: 12,
    expect: dayjs('2023-10-11T10:10:10').hour(12).startOf('hour').toDate(),
  },
  {
    now: '2023-10-11T10:10:10',
    for: 10,
    expect: dayjs('2023-10-11T10:10:10')
      .add(1, 'day')
      .hour(10)
      .startOf('hour')
      .toDate(),
  },
  {
    now: '2023-10-11T11:00:00',
    for: 11,
    expect: dayjs('2023-10-11T11:00:00').hour(11).startOf('hour').toDate(),
  },
  {
    now: '2023-10-11T11:00:01',
    for: 11,
    expect: dayjs('2023-10-11T11:00:00')
      .add(1, 'day')
      .hour(11)
      .startOf('hour')
      .toDate(),
  },
  {
    now: '2023-10-11T10:59:59',
    for: 11,
    expect: dayjs('2023-10-11T10:59:59').hour(11).startOf('hour').toDate(),
  },
];

describe('findDateAtNextHour tests', () => {
  tests.forEach(testData => {
    it(`with ${testData.now}, hour ${testData.for}, returns ${testData.expect}`, () => {
      mockDate.set(testData.now);
      const result = findDateAtNextHour(testData.for);
      expect(result.toString()).toBe(testData.expect.toString());
    });
  });

  afterEach(() => {
    mockDate.reset();
  });
});
