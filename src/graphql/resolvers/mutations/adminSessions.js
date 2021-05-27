/* eslint-disable import/prefer-default-export */
import debug from 'debug';
import sessionStore from '../../../dataSources/cloudFirestore/session';

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
      dlog('update batch called on %d sessions', sessions?.length);

      if (!Array.isArray(sessions))
        throw new Error('Session for batch update must be in an array.');

      return sessionStore(firestore).updateNonMentionBatch(sessions);
    },
  },
};
