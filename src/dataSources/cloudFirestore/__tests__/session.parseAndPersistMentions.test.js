let mentions;
const handleMentions = require('../session').parseAndPersistMentions;

jest.mock('@thatconference/api');

let scrubbedSession = {};
let returnSlugs;
let origEnv;

const javascriptSlug = {
  slug: 'javascript',
  id: 'testid-javascript',
  type: 'community',
};

describe('parseAndPersistMentions tests', () => {
  beforeAll(() => {
    mentions = require('@thatconference/api').mentions;
    origEnv = process.env;
    process.env.DEGUB = null;
  });
  afterAll(() => {
    process.env = origEnv;
  });
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
