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
    delete: (parent, { id }, { dataSources: { firestore } }) => {
      dlog('delete called');
      throw new Error('not implemented yet');
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
  },
};
