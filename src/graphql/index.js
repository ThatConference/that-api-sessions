import { pullAt, isNil } from 'lodash';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { buildSubgraphSchema } from '@apollo/subgraph';
import debug from 'debug';
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
const createServerParts = ({ dataSources, httpServer }) => {
  dlog('🚜 creating apollo server and context');
  let schema = {};

  dlog('🚜 building subgraph schema');
  schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

  const directiveTransformers = [
    directives.auth('auth').authDirectiveTransformer,
    directives.canMutate('canMutate').canMutateDirectiveTransformer,
  ];

  dlog('🚜 adding directiveTransformers: %O', directiveTransformers);
  schema = directiveTransformers.reduce(
    (curSchema, transformer) => transformer(curSchema),
    schema,
  );

  dlog('🚜 creating new apollo server instance');
  const graphQlServer = new ApolloServer({
    schema,
    introspection: JSON.parse(process.env.ENABLE_GRAPH_INTROSPECTION || false),
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: err => {
      Sentry.withScope(scope => {
        scope.setTag('formatError', true);
        scope.setLevel('warning');
        scope.setContext('originalError', { originalError: err.originalError });
        scope.setContext('locations', { location: err.locations });
        scope.setContext('path', { path: err.path });
        scope.setContext('error object', { error: err });
        if (err instanceof Error) {
          Sentry.captureException(err);
        } else {
          Sentry.captureException(new Error(err.message));
        }
      });

      return err;
    },
  });

  dlog('🚜 creating createContext function');
  const createContext = async ({ req, res }) => {
    dlog('🚜 bujilding graphql user context');
    dlog('🚜 assembling datasources');
    const { firestore } = dataSources;
    let context = {
      dataSources: {
        ...dataSources,
        sessionLoader: new DataLoader(async ids => {
          const sessions = await sessionStore(firestore).batchFindSessions(ids);
          return ids.map(id => {
            const foundAt = sessions.findIndex(s => s.id === id);

            if (foundAt < 0) return null;

            const result = sessions[foundAt];
            pullAt(sessions, foundAt);
            return result;
          });
        }),
      },
    };

    dlog('🚜 auth header %o', req.headers);
    if (!isNil(req.headers.authorization)) {
      dlog('🚜 validating token for %o:', req.headers.authorization);

      Sentry.addBreadcrumb({
        category: 'graphql context',
        message: 'user has authToken',
        level: 'info',
      });

      const validatedToken = await jwtClient.verify(req.headers.authorization);
      dlog('🚜 validated token: %o', validatedToken);

      Sentry.configureScope(scope => {
        scope.setUser({
          id: validatedToken.sub,
          permissions: validatedToken.permissions.toString(),
        });
      });

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
  };

  return {
    graphQlServer,
    createContext,
  };
};

export default createServerParts;
