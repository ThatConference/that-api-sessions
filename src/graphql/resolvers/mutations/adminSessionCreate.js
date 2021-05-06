/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import memberStore from '../../../dataSources/cloudFirestore/member';
import eventStore from '../../../dataSources/cloudFirestore/event';

const dlog = debug('that:api:sessions:mutation:AdminSessionCreate');

async function createNewSession({ eventId, user, session, firestore }) {
  const [sessionResults, userResults, eventResults] = await Promise.all([
    sessionStore(firestore).adminCreate({
      eventId,
      session,
    }),
    memberStore(firestore).find(user.sub),
    eventStore(firestore).getEvent(eventId),
  ]);

  return { sessionResults, userResults, eventResults };
}

function sendUserEvent({
  sessionResults,
  userResults,
  eventResults,
  userEvents,
  user,
}) {
  if (
    (sessionResults.status === 'SUBMITTED' ||
      sessionResults.status === 'ACCEPTED') &&
    sessionResults.startTime
  ) {
    userEvents.emit('adminSessionCreated', {
      user: {
        ...user,
        ...userResults,
      },
      session: sessionResults,
      event: eventResults,
    });
  }
}

export const fieldResolvers = {
  AdminSessionCreate: {
    openSpace: async (
      { eventId },
      { session: openspace },
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

      const {
        sessionResults,
        userResults,
        eventResults,
      } = await createNewSession({ eventId, user, session, firestore });

      sendUserEvent({
        sessionResults,
        userResults,
        eventResults,
        userEvents,
        user,
      });

      return sessionResults;
    },
    keynote: async (
      { eventId },
      { session: keynote },
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

      const {
        sessionResults,
        userResults,
        eventResults,
      } = await createNewSession({ eventId, user, session, firestore });

      sendUserEvent({
        sessionResults,
        userResults,
        eventResults,
        userEvents,
        user,
      });

      return sessionResults;
    },
    regular: async (
      { eventId },
      { session: regular },
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

      const {
        sessionResults,
        userResults,
        eventResults,
      } = await createNewSession({ eventId, user, session, firestore });

      sendUserEvent({
        sessionResults,
        userResults,
        eventResults,
        userEvents,
        user,
      });

      return sessionResults;
    },
    panel: async (
      { eventId },
      { session: panel },
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

      const {
        sessionResults,
        userResults,
        eventResults,
      } = await createNewSession({ eventId, user, session, firestore });

      sendUserEvent({
        sessionResults,
        userResults,
        eventResults,
        userEvents,
        user,
      });

      return sessionResults;
    },
    workshop: async (
      { eventId },
      { session: workshop },
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

      const {
        sessionResults,
        userResults,
        eventResults,
      } = await createNewSession({ eventId, user, session, firestore });

      sendUserEvent({
        sessionResults,
        userResults,
        eventResults,
        userEvents,
        user,
      });

      return sessionResults;
    },
  },
};
