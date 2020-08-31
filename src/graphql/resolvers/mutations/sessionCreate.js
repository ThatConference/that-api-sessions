/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import memberStore from '../../../dataSources/cloudFirestore/member';

const dlog = debug('that:api:sessions:mutation:SessionCreate');

async function createNewSession(eventId, user, session, firestore) {
  const [sessionResults, userResults] = await Promise.all([
    sessionStore(firestore).create({
      eventId,
      user,
      session,
    }),
    memberStore(firestore).find(user.sub),
  ]);

  return { sessionResults, userResults };
}

function sendUserEvent({ sessionResults, userResults, userEvents, user }) {
  if (
    sessionResults.status === 'SUBMITTED' ||
    sessionResults.status === 'ACCEPTED'
  ) {
    userEvents.emit('sessionCreated', {
      user: {
        ...user,
        ...userResults,
      },
      session: sessionResults,
    });
  }
}

export const fieldResolvers = {
  SessionCreate: {
    create: async (
      { eventId },
      { session },
      {
        dataSources: {
          firestore,
          events: { userEvents },
        },
        user,
      },
    ) => {
      dlog('create called, user.sub: %s', user.sub);

      const [sessionResults, userResults] = await Promise.all([
        sessionStore(firestore).create({
          eventId,
          user,
          session,
        }),
        memberStore(firestore).find(user.sub),
      ]);

      sendUserEvent({ sessionResults, userResults, userEvents, user });

      return sessionResults;
    },
    openSpace: async (
      { eventId },
      { openspace },
      {
        dataSources: {
          firestore,
          events: { userEvents },
        },
        user,
      },
    ) => {
      dlog('openSpace called');

      const session = openspace;
      session.type = 'OPEN_SPACE';

      const { sessionResults, userResults } = await createNewSession(
        eventId,
        user,
        session,
        firestore,
      );

      sendUserEvent({ sessionResults, userResults, userEvents, user });

      return sessionResults;
    },
    keynote: async (
      { eventId },
      { keynote },
      {
        dataSources: {
          firestore,
          events: { userEvents },
        },
        user,
      },
    ) => {
      dlog('keynote called');

      const session = keynote;
      session.type = 'KEYNOTE';

      const { sessionResults, userResults } = await createNewSession(
        eventId,
        user,
        session,
        firestore,
      );

      sendUserEvent({ sessionResults, userResults, userEvents, user });

      return sessionResults;
    },
    regular: async (
      { eventId },
      { regular },
      {
        dataSources: {
          firestore,
          events: { userEvents },
        },
        user,
      },
    ) => {
      dlog('regular called');

      const session = regular;
      session.type = 'REGULAR';

      const { sessionResults, userResults } = await createNewSession(
        eventId,
        user,
        session,
        firestore,
      );

      sendUserEvent({ sessionResults, userResults, userEvents, user });

      return sessionResults;
    },
    panel: async (
      { eventId },
      { panel },
      {
        dataSources: {
          firestore,
          events: { userEvents },
        },
        user,
      },
    ) => {
      dlog('openSpace called');

      const session = panel;
      session.type = 'PANEL';

      const { sessionResults, userResults } = await createNewSession(
        eventId,
        user,
        session,
        firestore,
      );

      sendUserEvent({ sessionResults, userResults, userEvents, user });

      return sessionResults;
    },
    workshop: async (
      { eventId },
      { workshop },
      {
        dataSources: {
          firestore,
          events: { userEvents },
        },
        user,
      },
    ) => {
      dlog('workshop called');

      const session = workshop;
      session.type = 'WORKSHOP';

      const { sessionResults, userResults } = await createNewSession(
        eventId,
        user,
        session,
        firestore,
      );

      sendUserEvent({ sessionResults, userResults, userEvents, user });

      return sessionResults;
    },
  },
};
