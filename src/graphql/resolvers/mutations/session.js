/* eslint-disable import/prefer-default-export */
import debug from 'debug';
import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:mutation:SessionMutation');

export const fieldResolvers = {
  SessionMutation: {
    update: ({ sessionId }) => {
      dlog('update called', sessionId);
      return { sessionId };
    },

    setAttended: ({ sessionId }, __, { dataSources: { firestore }, user }) => {
      dlog('attended called %s', sessionId, user.sub);
      return sessionStore(firestore).addInAttendance(sessionId, user);
    },
  },
};
