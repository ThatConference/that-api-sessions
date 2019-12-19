/* eslint-disable import/prefer-default-export */
import debug from 'debug';

// import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that-api-sessions:query');

export const fieldResolvers = {
  SessionsQuery: {
    accepted: async (
      parent,
      { year },
      { dataSources: { firestore, logger } },
    ) => {
      dlog('SessionQuery:sessions called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
    all: async (parent, { year }, { dataSources: { firestore, logger } }) => {
      dlog('SessionQuery:sessions called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
    me: async (parent, args, { dataSources: { firestore, logger } }) => {
      dlog('SessionQuery:sessions called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
    session: async (parent, args, { dataSources: { firestore, logger } }) => {
      dlog('SessionQuery:sessions called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
  },
};
