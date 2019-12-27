/* eslint-disable import/prefer-default-export */
import debug from 'debug';
import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:mutation');

export const fieldResolvers = {
  SessionsMutation: {
    create: async (
      parent,
      { eventId, session },
      { dataSources: { firestore, logger }, user },
    ) => {
      dlog('SessionsMutation:create called');

      // todo: call out to postmark
      const newSession = await sessionStore(firestore, logger).create({
        eventId,
        user,
        session,
      });

      return newSession;
    },
    delete: async (parent, { id }, { dataSources: { firestore, logger } }) => {
      dlog('SessionsMutation:delete called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
    session: (parent, { id }) => {
      dlog('SessionsMutation:session called');
      return { sessionId: id };
    },
  },
};
