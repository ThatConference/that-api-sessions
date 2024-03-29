/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
import http from 'node:http';
import express from 'express';
import { json } from 'body-parser';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import debug from 'debug';
import { Firestore } from '@google-cloud/firestore';
import { Client as Postmark } from 'postmark';
import responseTime from 'response-time';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/node';
import { events as apiEvents } from '@thatconference/api';

import apolloGraphServer from './graphql';
import envConfig from './envConfig';
import userEventEmitter from './events/user';
import adminEventEmitter from './events/admin';

import { version } from './package.json';

const firestore = new Firestore();
const dlog = debug('that:api:sessions:index');
const api = express();
const port = process.env.PORT || 8003;
const defaultVersion = `that-api-sessions@${version}`;
const graphCdnEmitter = apiEvents.graphCdn;
const favEventEmitter = apiEvents.favorites;

const postmark = new Postmark(envConfig.postmarkApiToken);
const userEvents = userEventEmitter(postmark);
const adminEvents = adminEventEmitter(postmark);
const graphCdnEvents = graphCdnEmitter(Sentry);
const favoritesEvents = favEventEmitter({ firestore, sentry: Sentry });

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.THAT_ENVIRONMENT,
  debug: process.env.NODE_ENV === 'development',
  release: process.env.SENTRY_VERSION || defaultVersion,
  normalizeDepth: 6,
});

Sentry.configureScope(scope => {
  scope.setTag('thatApp', 'that-api-sessions');
});

const httpServer = http.createServer(api);

const createConfig = () => {
  dlog('createConfig');

  return {
    dataSources: {
      sentry: Sentry,
      firestore,
      postmark,
      events: {
        userEvents,
        adminEvents,
        graphCdnEvents,
        favoritesEvents,
      },
    },
    httpServer,
  };
};

const graphServerParts = apolloGraphServer(createConfig());

const sentryMark = async (req, res, next) => {
  Sentry.addBreadcrumb({
    category: 'that-api-sessions',
    message: 'sessions init',
    level: 'info',
  });

  next();
};

/**
 * http middleware function
 * here we are intercepting the http call and building our own notion of a users context.
 * we then add it to the request so it can later be used by the gateway.
 * If you had something like a token that needs to be passed through to the gateways children this is how you intercept it and setup for later.
 *
 * @param {string} req - http request
 * @param {string} res - http response
 * @param {string} next - next function to execute
 *
 */
const createUserContext = (req, res, next) => {
  dlog('creating user context');

  const correlationId =
    req.headers['that-correlation-id'] &&
    req.headers['that-correlation-id'] !== 'undefined'
      ? req.headers['that-correlation-id']
      : uuidv4();

  Sentry.configureScope(scope => {
    scope.setTag('correlationId', correlationId);
    scope.setContext('headers', {
      headers: req.headers,
    });
  });

  let site;
  if (req.headers['that-site']) {
    site = req.headers['that-site'];
  } else if (req.headers['x-forwarded-for']) {
    // eslint-disable-next-line no-useless-escape
    const rxHost = /^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i;
    const refererHost = req.headers['x-forwarded-for'];
    const host = refererHost.match(rxHost);
    if (host) [, site] = host;
  } else {
    site = 'www.thatconference.com';
  }

  Sentry.configureScope(scope => {
    scope.setTag('site', site);
  });

  req.userContext = {
    locale: req.headers.locale,
    authToken: req.headers.authorization,
    correlationId,
    site,
  };
  dlog('headers %o', req.headers);
  dlog('userContext %o', req.userContext);

  next();
};

function getVersion(req, res) {
  dlog('method %s, defaultVersion %s', req.method, defaultVersion);
  return res.json({ version: defaultVersion });
}

function failure(err, req, res, next) {
  dlog('error %o', err);
  Sentry.captureException(err);

  res.set('Content-Type', 'application/json').status(500).json(err);
}

// api.use(responseTime()).use(useSentry).use(createUserContext).use(failure);
api.use(
  Sentry.Handlers.requestHandler(),
  cors(),
  responseTime(),
  json(),
  sentryMark,
  createUserContext,
);
api.use('/version', getVersion);

const { graphQlServer, createContext } = graphServerParts;

graphQlServer
  .start()
  .then(() => {
    api.use(
      expressMiddleware(graphQlServer, {
        context: async ({ req }) => createContext({ req }),
      }),
    );
  })
  .catch(err => {
    console.log(`graphServer.start() error 💥: ${err.message}`);
    Sentry.captureException(err);
    throw err;
  });

api.use(Sentry.Handlers.errorHandler()).use(failure);

api.listen({ port }, () =>
  console.log(`✨ Sessions 🗣️ is running on 🚢 port ${port}`),
);
