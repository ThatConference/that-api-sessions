/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import memberStore from '../../../dataSources/cloudFirestore/member';

const dlog = debug('that:api:sessions:mutation');

export const fieldResolvers = {
  SessionMutation: {
    update: async (
      { sessionId },
      { session },
      {
        dataSources: {
          firestore,
          logger,
          events: { userEvents },
        },
        user,
      },
    ) => {
      dlog('TCL: events %o', userEvents);
      dlog('SessionMutation:update called');

      const [sessionResults, userResults] = await Promise.all([
        sessionStore(firestore, logger).update({
          user,
          sessionId,
          session,
        }),

        memberStore(firestore, logger).find(user.sub),
      ]);

      if (sessionResults.status === 'ACCEPTED') {
        userEvents.emit('sessionUpdated', {
          user: userResults,
          session: sessionResults,
        });
      }

      return sessionResults;
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
