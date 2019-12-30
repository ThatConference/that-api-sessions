/* eslint-disable no-unused-vars */
/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:me');

export const fieldResolvers = {
  MeQuery: {
    all: async (_, __, { dataSources: { firestore, logger }, user }) => {
      dlog('my all called');
      return sessionStore(firestore, logger).findMy({ user });
    },
    session: async (
      _,
      { id },
      { dataSources: { firestore, logger }, user },
    ) => {
      dlog('my session called');

      return sessionStore(firestore, logger).findMySession({
        user,
        sessionId: id,
      });
    },
  },
};
