// no changes
const test0 = {
  original: {
    title: 'orig0',
    startTime: new Date('2021-07-13T01:27:49.605Z'),
    location: {
      destination: 'A',
      isOnline: false,
    },
  },
  updated: {
    title: 'orig0',
    startTime: new Date('2021-07-13T01:27:49.605Z'),
    location: {
      destination: 'A',
      isOnline: false,
    },
  },
};
// date change
const test1 = {
  original: {
    title: 'orig1',
    startTime: new Date('2021-07-13T02:27:49.605Z'),
    location: null,
  },
  updated: {
    title: 'orig1',
    startTime: new Date('2021-07-13T01:27:49.605Z'),
    location: null,
  },
};
// location change
const test2 = {
  original: {
    title: 'orig2',
    startTime: new Date('2021-07-13T01:27:49.605Z'),
    location: null,
  },
  updated: {
    title: 'orig2',
    startTime: new Date('2021-07-13T01:27:49.605Z'),
    location: {
      destination: 'AFRICA_10',
      isOnline: false,
    },
  },
};
// title change
const test3 = {
  original: {
    title: 'orig3',
    startTime: new Date('2021-07-13T01:27:49.605Z'),
    location: {
      destination: 'C',
      isOnline: false,
    },
  },
  updated: {
    title: 'orig_3',
    startTime: new Date('2021-07-13T01:27:49.605Z'),
    location: {
      destination: 'C',
      isOnline: false,
    },
  },
};
// no time to time
const test4 = {
  original: {
    title: 'orig4',
    startTime: null,
    location: {
      destination: 'A',
      isOnline: false,
    },
  },
  updated: {
    title: 'orig4',
    startTime: new Date('2021-07-13T01:27:49.605Z'),
    location: {
      destination: 'A',
      isOnline: false,
    },
  },
};

let hasChanges = null;
describe('Valadate function hasChangesforEventNotification', () => {
  beforeAll(() => {
    process.env.INFLUX_TOKEN = 'TEST_INFLUX_TOKEN_VALUE';
    process.env.INFLUX_ORG_ID = 'TEST_INFLUX_ORG_ID_VALUE';
    process.env.INFLUX_BUCKET_ID = 'INFLUX_BUCKET_ID';
    process.env.INFLUX_HOST = 'INFLUX_HOST';
    process.env.POSTMARK_API_TOKEN = 'POSTMARK_API_TOKEN';
    process.env.STRIPE_PUBLISHABLE_KEY = 'STRIPE_PUBLISHABLE_KEY';
    process.env.STRIPE_SECRET_KEY = 'STRIPE_SECRET_KEY';
    process.env.BOUNCER_BASE_URL = 'BOUNCER_BASE_URL';

    hasChanges = require('../adminSessionUpdate')
      .hasChangesforEventNotification;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Correctly determined changes in time or room', () => {
    it('has no changes', () => {
      expect(
        hasChanges({
          originalSession: test0.original,
          updatedSession: test0.updated,
        }),
      ).toBe(false);
    });

    it('has changed time', () => {
      expect(
        hasChanges({
          originalSession: test1.original,
          updatedSession: test1.updated,
        }),
      ).toBe(true);
    });

    it('has changed room', () => {
      expect(
        hasChanges({
          originalSession: test2.original,
          updatedSession: test2.updated,
        }),
      ).toBe(true);
    });

    it('will not detect title change', () => {
      expect(
        hasChanges({
          originalSession: test3.original,
          updatedSession: test3.updated,
        }),
      ).toBe(false);
    });

    it('will detect as changed', () => {
      expect(
        hasChanges({
          originalSession: test0.original,
          updatedSession: test3.updated,
        }),
      ).toBe(true);
    });

    it('Detect changed null time to value', () => {
      expect(
        hasChanges({
          originalSession: test4.original,
          updatedSession: test4.updated,
        }),
      ).toBe(true);
    });
  });
});
