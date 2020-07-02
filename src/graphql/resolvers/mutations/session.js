/* eslint-disable import/prefer-default-export */
import debug from 'debug';

const dlog = debug('that:api:sessions:mutation:SessionMutation');

export const fieldResolvers = {
  SessionMutation: {
    update: ({ sessionId }) => {
      dlog('update called', sessionId);
      return { sessionId };
    },
    cancel: ({ sessionId }, args, { dataSources: { firestore } }) => {
      dlog('SessionMutation:cancel called');
      throw new Error('not implemented yet');
      // sessionStore(firestore, logger).get(id),
    },
  },
};
