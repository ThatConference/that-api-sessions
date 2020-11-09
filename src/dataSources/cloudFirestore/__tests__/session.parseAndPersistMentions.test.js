/* have not found a solution to not requires these to run the tests
 * they are needed by @thatconference/api
 */
process.env.INFLUX_TOKEN = 'TEST_INFLUX_TOKEN_VALUE';
process.env.INFLUX_ORG_ID = 'TEST_INFLUX_ORG_ID_VALUE';
process.env.INFLUX_BUCKET_ID = 'INFLUX_BUCKET_ID';
process.env.INFLUX_HOST = 'INFLUX_HOST';

const mentions = require('@thatconference/api').mentions;
const handleMentions = require('../session').parseAndPersistMentions;

jest.mock('@thatconference/api');

let scrubbedSession = {};
let returnSlugs;

const javascriptSlug = {
  slug: 'javascript',
  id: 'testid-javascript',
  type: 'community',
};

describe('parseAndPersistMentions tests', () => {
  beforeEach(() => {
    scrubbedSession = {
      id: 'testid-scrubbedSession',
      title: 'test title',
      shortDescription: 'Testing of the @cool mentions',
      communities: ['that'],
    };
    returnSlugs = [
      {
        slug: 'brettski',
        id: 'testid-brettski',
        type: 'member',
      },
    ];
  });

  afterEach(() => {
    scrubbedSession = null;
    returnSlugs = null;
  });

  mentions.parseToSlug.mockResolvedValue(returnSlugs);

  it('will be a function', () => {
    expect(typeof handleMentions).toBe('function');
  });

  it(`will return 'that' community only. no communities`, () => {
    delete scrubbedSession.communities;
    mentions.parseToSlug.mockResolvedValue(returnSlugs);
    return handleMentions({ scrubbedSession, firestore: {} }).then(data => {
      expect(data).toBeUndefined();
      expect(scrubbedSession.communities).toEqual(['that']);
    });
  });

  it(`will return 'that' community only. with community`, () => {
    mentions.parseToSlug.mockResolvedValue(returnSlugs);
    return handleMentions({ scrubbedSession, firestore: {} }).then(() => {
      expect(scrubbedSession.communities).toEqual(['that']);
    });
  });

  it(`will return 'that', 'javascript' community.`, () => {
    returnSlugs.push(javascriptSlug);
    mentions.parseToSlug.mockResolvedValue(returnSlugs);
    return handleMentions({ scrubbedSession, firestore: {} }).then(() => {
      expect(scrubbedSession.communities).toEqual(['that', 'javascript']);
    });
  });

  it(`will remove 'testing' community`, () => {
    scrubbedSession.communities.push('testing');
    returnSlugs.push(javascriptSlug);
    mentions.parseToSlug.mockResolvedValue(returnSlugs);
    return handleMentions({ scrubbedSession, firestore: {} }).then(() => {
      expect(scrubbedSession.communities).toEqual(['that', 'javascript']);
    });
  });
});
