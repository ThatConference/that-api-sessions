/* eslint-disable no-unused-vars */
/* eslint-disable import/prefer-default-export */
import debug from 'debug';
import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:query:SessionsQuery');

export const fieldResolvers = {
  SessionsQuery: {
    me: () => {
      dlog('me called');
      return {};
    },
    session: (_, { sessionId }, { dataSources: { firestore } }) => {
      dlog('session called');
      return sessionStore(firestore).findAcceptedSession(sessionId);
    },
  },
};
