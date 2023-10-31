import { findDateAtNextHour } from '../findDateAtNextHour';
import mockDate from 'mockdate';

const tests = [
  {
    now: '2023-10-11T10:10:10',
    for: 8,
    expect: new Date('2023-10-12T08:00:00'),
  },
  {
    now: '2023-10-11T10:10:10',
    for: 12,
    expect: new Date('2023-10-11T12:00:00'),
  },
  {
    now: '2023-10-11T10:10:10',
    for: 10,
    expect: new Date('2023-10-12T10:00:00'),
  },
  {
    now: '2023-10-11T11:00:00',
    for: 11,
    expect: new Date('2023-10-11T11:00:00'),
  },
  {
    now: '2023-10-11T11:00:01',
    for: 11,
    expect: new Date('2023-10-12T11:00:00'),
  },
  {
    now: '2023-10-11T10:59:59',
    for: 11,
    expect: new Date('2023-10-11T11:00:00'),
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
