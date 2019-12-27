/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:mutation');

export const fieldResolvers = {
  SessionMutation: {
    update: async (
      { sessionId },
      { session },
      { dataSources: { firestore, logger } },
    ) => {
      dlog('SessionMutation:update called');

      // todo: call out to postmark here and notify users of an update...

      const results = await sessionStore(firestore, logger).update({
        sessionId,
        session,
      });

      return results;
    },
    cancel: async (
      { sessionId },
      args,
      { dataSources: { firestore, logger } },
    ) => {
      dlog('SessionMutation:cancel called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
    castVote: async (
      { sessionId },
      { session },
      { dataSources: { firestore, logger } },
    ) => {
      dlog('SessionMutation:castVote called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
  },
};
