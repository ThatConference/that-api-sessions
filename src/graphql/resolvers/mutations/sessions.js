/* eslint-disable import/prefer-default-export */
import debug from 'debug';

// import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that-api-sessions:mutation');

export const fieldResolvers = {
  SessionsMutation: {
    create: async (
      parent,
      { session },
      { dataSources: { firestore, logger } },
    ) => {
      dlog('SessionsMutation:create called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
    delete: async (parent, { id }, { dataSources: { firestore, logger } }) => {
      dlog('SessionsMutation:delete called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
    session: async (parent, { id }) => {
      dlog('SessionsMutation:session called');
      return { sessionId: id };
    },
  },
};
