/* eslint-disable no-unused-vars */
/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:query');

export const fieldResolvers = {
  SessionsQuery: {
    accepted: async (
      parent,
      { year },
      { dataSources: { firestore, logger } },
    ) => {
      dlog('accepted called');
      throw new Error('not implemented yet');
    },
    all: (parent, { year }, { dataSources: { firestore, logger } }) => {
      dlog('all called');
      throw new Error('not implemented yet');
    },
    me: (parent, args, { dataSources: { firestore, logger }, user }) => {
      dlog('me called');

      return {};
    },
    session: (parent, args, { dataSources: { firestore, logger } }) => {
      dlog('session called');
      throw new Error('not implemented yet');
    },
  },
};
