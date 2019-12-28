/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:mutation');

export const fieldResolvers = {
  SessionMutation: {
    update: async (
      { sessionId },
      { session },
      { dataSources: { firestore, logger, postmark }, user },
    ) => {
      dlog('SessionMutation:update called');

      const results = await sessionStore(firestore, logger).update({
        user,
        sessionId,
        session,
      });

      // postmark.sendEmail({
      //   From: 'hello@thatconference.com',
      //   To: 'hello@thatconference.com',
      //   Subject: 'Your session has been updated.',
      //   TextBody: 'Hello from Postmark!',
      // });

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
