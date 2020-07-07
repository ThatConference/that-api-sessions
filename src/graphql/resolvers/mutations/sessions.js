/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import eventStore from '../../../dataSources/cloudFirestore/event';

const dlog = debug('that:api:sessions:mutation:SessionsMutation');

export const fieldResolvers = {
  SessionsMutation: {
    create: (parent, { eventId }) => {
      dlog('create called');
      return { eventId };
    },

    session: (parent, { id }) => {
      dlog('session called');
      return { sessionId: id };
    },

    voting: async (_, { eventId }, { dataSources: { firestore } }) => {
      dlog('voting');
      const { isVotingOpen } = await eventStore(firestore).getEvent(eventId);

      if (!isVotingOpen) throw new Error('voting is currently closed');

      return { eventId };
    },

    favoriting: (_, { eventId }, { dataSources: { firestore } }) => {
      dlog('favoriting');
      return { eventId };
    },

    admin: () => {
      dlog('admin called');
      return {};
    },
  },
};
