/* eslint-disable no-unused-vars */
/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:query:SessionsQuery');

export const fieldResolvers = {
  SessionsQuery: {
    me: (parent, args, { dataSources: { firestore, logger }, user }) => {
      dlog('me called');
      return {};
    },
    session: (_, { slug }, { dataSources: { firestore, logger } }) => {
      dlog('session by slug called "%s"', slug);
      return sessionStore(firestore, logger).findSessionBySlug(slug);
    },
  },
};
