import { pullAt, isNil } from 'lodash';
import { ApolloServer } from 'apollo-server-express';
import debug from 'debug';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { security } from '@thatconference/api';
import DataLoader from 'dataloader';
import * as Sentry from '@sentry/node';

// Graph Types and Resolvers
import typeDefs from './typeDefs';
import resolvers from './resolvers';
import directives from './directives';
import sessionStore from '../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:graphServer');
const jwtClient = security.jwt();

/**
 * will create you a configured instance of an apollo gateway
 * @param {object} userContext - user context that w
 * @return {object} a configured instance of an apollo gateway.
 *
 * @example
 *
 *     createGateway(userContext)
 */
const createServer = ({ dataSources }) => {
  dlog('creating apollo server');
  let schema = {};

  schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

  const directiveTransformers = [
    directives.auth('auth').authDirectiveTransformer,
    directives.canMutate('canMutate').canMutateDirectiveTransformer,
  ];

  dlog('directiveTransformers: %O', directiveTransformers);
  schema = directiveTransformers.reduce(
    (curSchema, transformer) => transformer(curSchema),
    schema,
  );

  return new ApolloServer({
    schema,
    introspection: JSON.parse(process.env.ENABLE_GRAPH_INTROSPECTION || false),
    csrfPrevention: true,
    cache: 'bounded',
    dataSources: () => {
      dlog('creating dataSources');
      const { firestore } = dataSources;

      const sessionLoader = new DataLoader(async ids => {
        const sessions = await sessionStore(firestore).batchFindSessions(ids);
        return ids.map(id => {
          const foundAt = sessions.findIndex(s => s.id === id);

          if (foundAt < 0) return null;

          const result = sessions[foundAt];
          pullAt(sessions, foundAt);
          return result;
        });
      });

      return {
        ...dataSources,
        sessionLoader,
      };
    },
    context: async ({ req, res }) => {
      dlog('creating context');
      let context = {};
      dlog('auth header %o', req.headers);
      if (!isNil(req.headers.authorization)) {
        Sentry.addBreadcrumb({
          category: 'graphql context',
          message: 'user has authToken',
          level: 'info',
        });

        dlog('validating token for %o:', req.headers.authorization);

        const validatedToken = await jwtClient.verify(
          req.headers.authorization,
        );

        Sentry.configureScope(scope => {
          scope.setUser({
            id: validatedToken.sub,
            permissions: validatedToken.permissions.toString(),
          });
        });

        dlog('validated token: %o', validatedToken);
        context = {
          ...context,
          user: {
            ...validatedToken,
            site: req.userContext.site,
            correlationId: req.userContext.correlationId,
          },
        };
      }

      return context;
    },
    plugins: [],
    formatError: err => {
      Sentry.withScope(scope => {
        scope.setTag('formatError', true);
        scope.setLevel('warning');

        scope.setExtra('originalError', err.originalError);
        scope.setExtra('path', err.path);

        Sentry.captureException(err);
      });

      return err;
    },
  });
};

export default createServer;
