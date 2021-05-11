/* eslint-disable import/prefer-default-export */
import debug from 'debug';

const dlog = debug('that:api:sessions:mutation:AdminSessions');

export const fieldResolvers = {
  AdminSessionsMutation: {
    create: (_, { eventId }) => {
      dlog('create called');
      return { eventId };
    },

    delete: () => {
      dlog('delete called');
      throw new Error('not implemented yet');
    },

    session: (_, { id }) => {
      dlog('session called');
      return { sessionId: id };
    },

    updateScheduleBatch: (_, { sessions }, { dataSources: { firestore } }) => {
      dlog('update batch colled on %d sessions', sessions?.length);
      throw new Error('Not Implemented!');
    },
  },
};
