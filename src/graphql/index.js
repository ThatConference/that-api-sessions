import _ from 'lodash';
import {
  ApolloServer,
  gql,
  addMockFunctionsToSchema,
  mergeSchemas,
} from 'apollo-server-express';
import debug from 'debug';
import { buildFederatedSchema } from '@apollo/federation';
import { security, graph } from '@thatconference/api';
import DataLoader from 'dataloader';
import * as Sentry from '@sentry/node';

// Graph Types and Resolvers
import typeDefsRaw from './typeDefs';
import resolvers from './resolvers';
import directives from './directives';
import sessionStore from '../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:graphServer');
const jwtClient = security.jwt();
const { lifecycle } = graph.events;

// convert our raw schema to gql
const typeDefs = gql`
  ${typeDefsRaw}
`;

/**
 * will create you a configured instance of an apollo gateway
 * @param {object} userContext - user context that w
 * @return {object} a configured instance of an apollo gateway.
 *
 * @example
 *
 *     createGateway(userContext)
 */
const createServer = ({ dataSources }, enableMocking = false) => {
  let federatedSchemas = {};

  if (!enableMocking) {
    federatedSchemas = buildFederatedSchema([{ typeDefs, resolvers }]);
  } else {
    federatedSchemas = buildFederatedSchema([{ typeDefs }]);

    addMockFunctionsToSchema({
      federatedSchemas,
      // eslint-disable-next-line global-require
      mocks: require('./__mocks__').default(),
      preserveResolvers: true, // so GetServiceDefinition works
    });
  }

  const schema = mergeSchemas({
    schemas: [federatedSchemas],
    schemaDirectives: {
      ...directives,
    },
  });

  return new ApolloServer({
    schemaDirectives: {},
    schema,
    introspection: JSON.parse(process.env.ENABLE_GRAPH_INTROSPECTION || false),
    playground: JSON.parse(process.env.ENABLE_GRAPH_PLAYGROUND)
      ? { endpoint: '/' }
      : false,

    dataSources: () => {
      dlog('creating dataSources');
      const { firestore } = dataSources;

      const sessionLoader = new DataLoader(async ids => {
        const sessions = await sessionStore(firestore).batchFindSessions(ids);
        return ids.map(id => {
          const foundAt = sessions.findIndex(s => s.id === id);

          if (foundAt < 0) return null;

          const result = sessions[foundAt];
          _.pullAt(sessions, foundAt);
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
      if (!_.isNil(req.headers.authorization)) {
        Sentry.addBreadcrumb({
          category: 'graphql context',
          message: 'user has authToken',
          level: Sentry.Severity.Info,
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

    plugins: [
      {
        requestDidStart(req) {
          return {
            executionDidStart(requestContext) {
              lifecycle.emit('executionDidStart', {
                service: 'that:api:sessions',
                requestContext,
              });
            },
          };
        },
      },
    ],
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
