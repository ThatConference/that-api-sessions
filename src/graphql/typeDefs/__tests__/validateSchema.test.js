/* resolvers use thatconference/api which needs these env variables. */
/* this test is more about successfully building the schema then the
 * resulting schema from the build.
 */
import { buildSubgraphSchema } from '@apollo/subgraph';
import { ApolloServer } from '@apollo/server';
import typeDefs from '../../typeDefs';
import directives from '../../directives';

let resolvers;
let originalEnv;

describe('validate schema test', () => {
  beforeAll(() => {
    originalEnv = process.env;
    process.env.POSTMARK_API_TOKEN = 'POSTMARK_API_TOKEN';
    process.env.STRIPE_PUBLISHABLE_KEY = 'STRIPE_PUBLISHABLE_KEY';
    process.env.STRIPE_SECRET_KEY = 'STRIPE_SECRET_KEY';
    process.env.BOUNCER_BASE_URL = 'BOUNCER_BASE_URL';
    process.env.GCP_CALENDAR_CREDENTIALS = 'TEST_GCP_VALUE';
    process.env.SHARED_CALENDAR_ID = 'TEST_CALENDAR_ID';
    process.env.SLACK_WEBHOOK_URL = 'https://test_hook_value';

    resolvers = require('../../resolvers');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  /* Checking directives is not working. Fails on auth:
   * * ReferenceError: defaultFieldResolver is not defined
   */
  // const directives = require('../../directives').default;
  // import directives from '../../directives';

  let schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

  // TODO: find other ways to validate all of this
  describe('Validate graphql schema', () => {
    it('schema has successfully built and is and object', () => {
      expect(typeof schema).toBe('object');
      expect(schema).toBeInstanceOf(Object);
      expect(schema?._queryType.name).toBe('Query');
    });
    it('will add auth directive successfully', () => {
      const { authDirectiveTransformer } = directives.auth('auth');
      schema = authDirectiveTransformer(schema);

      expect(typeof schema).toBe('object');
      expect(schema).toBeInstanceOf(Object);
      expect(schema?._directives?.length).toBeGreaterThan(0);
    });
    it('will run in server correctly', () => {
      const serv = new ApolloServer({ schema });

      expect(serv).toBeInstanceOf(ApolloServer);
      expect(serv?.internals?.nodeEnv).toBe('test');

      const csrfPreventionRequestHeaders =
        serv?.internals?.csrfPreventionRequestHeaders;
      const expected = ['x-apollo-operation-name', 'apollo-require-preflight'];
      expect(csrfPreventionRequestHeaders).toEqual(
        expect.arrayContaining(expected),
      );
    });
  });
});
