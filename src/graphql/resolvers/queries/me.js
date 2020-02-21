import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import eventStore from '../../../dataSources/cloudFirestore/event';

const dlog = debug('that:api:sessions:me');

export const fieldResolvers = {
  MeQuery: {
    all: (_, __, { dataSources: { firestore, logger }, user }) => {
      dlog('my all called');
      return sessionStore(firestore, logger).findMy({ user });
    },
    session: (_, { id }, { dataSources: { firestore, logger }, user }) => {
      dlog('my session called');

      return sessionStore(firestore, logger).findMySession({
        user,
        sessionId: id,
      });
    },
    voting: async (_, { eventId }, { dataSources: { firestore } }) => {
      const { isVotingOpen } = await eventStore(firestore).getEvent(eventId);

      return { eventId, isVotingOpen };
    },
  },
};
