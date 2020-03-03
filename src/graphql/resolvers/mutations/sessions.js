/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import memberStore from '../../../dataSources/cloudFirestore/member';
import eventStore from '../../../dataSources/cloudFirestore/event';

const dlog = debug('that:api:sessions:mutation');

export const fieldResolvers = {
  SessionsMutation: {
    create: async (
      parent,
      { eventId, session },
      {
        dataSources: {
          firestore,
          events: { userEvents },
        },
        user,
      },
    ) => {
      dlog('SessionsMutation:create called');

      const [sessionResults, userResults] = await Promise.all([
        sessionStore(firestore).create({
          eventId,
          user,
          session,
        }),
        memberStore(firestore).find(user.sub),
      ]);

      if (sessionResults.status === 'SUBMITTED') {
        userEvents.emit('newSessionCreated', {
          user: userResults,
          session: sessionResults,
        });
      }

      return sessionResults;
    },
    delete: (parent, { id }, { dataSources: { firestore } }) => {
      dlog('SessionsMutation:delete called');
      throw new Error('not implemented yet');
    },

    session: (parent, { id }) => {
      dlog('SessionsMutation:session called');
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
