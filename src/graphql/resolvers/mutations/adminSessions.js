/* eslint-disable import/prefer-default-export */
import debug from 'debug';

const dlog = debug('that:api:sessions:mutation:AdminSessionsMutation');

export const fieldResolvers = {
  AdminSessionsMutation: {
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
  },
};
