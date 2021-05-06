import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import memberStore from '../../../dataSources/cloudFirestore/member';
import eventStore from '../../../dataSources/cloudFirestore/event';

const dlog = debug('that:api:sessions:mutation:AdminSessionUpdate');

async function updateSession({ eventId, sessionId, user, session, firestore }) {
  const [updatedSession, userResults, eventResults] = await Promise.all([
    sessionStore(firestore).adminUpdate({
      sessionId,
      session,
    }),
    memberStore(firestore).find(user.sub),
    eventStore(firestore).getEvent(eventId),
  ]);

  return { updatedSession, userResults, eventResults };
}

function sendUserEvent({
  originalSession,
  updatedSession,
  userResults,
  userEvents,
  user,
  eventResults,
}) {
  dlog(
    'sendUserEvent original status: %s, updated status: %s',
    originalSession.status,
    updatedSession.status,
  );
  let eventTitle = '';
  const userInfo = {
    ...user,
    ...userResults,
  };

  if (
    originalSession.status === 'DRAFT' &&
    updatedSession.status === 'SUBMITTED'
  ) {
    eventTitle = 'adminSessionCreated';
  } else if (updatedSession.status === 'ACCEPTED') {
    eventTitle = 'adminSessionUpdated';
  } else if (updatedSession.status === 'CANCELLED') {
    eventTitle = 'adminSessionCancelled';
  }

  userEvents.emit(eventTitle, {
    user: userInfo,
    session: updatedSession,
    event: eventResults,
  });
}

export const fieldResolvers = {
  AdminSessionUpdate: {
    openSpace: async (
      { sessionId },
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

      // we need the original before we update it.
      const originalSession = await sessionStore(firestore).findSession(
        sessionId,
      );

      if (!originalSession)
        throw new Error(
          `sessionId ${sessionId}, not found. Unable to update session`,
        );

      const { updatedSession, userResults, eventResults } = await updateSession(
        {
          eventId: originalSession.eventId,
          sessionId,
          user,
          session: openspace,
          firestore,
        },
      );

      sendUserEvent({
        originalSession,
        updatedSession,
        userResults,
        userEvents,
        user,
        eventResults,
      });

      return updatedSession;
    },
    keynote: async (
      { sessionId },
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

      // we need the original before we update it.
      const originalSession = await sessionStore(firestore).findSession(
        sessionId,
      );

      if (!originalSession)
        throw new Error(
          `sessionId ${sessionId}, not found. Unable to update session`,
        );

      const { updatedSession, userResults, eventResults } = await updateSession(
        {
          eventId: originalSession.eventId,
          sessionId,
          user,
          session: keynote,
          firestore,
        },
      );

      sendUserEvent({
        originalSession,
        updatedSession,
        userResults,
        userEvents,
        user,
        eventResults,
      });

      return updatedSession;
    },
    regular: async (
      { sessionId },
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

      // we need the original before we update it.
      const originalSession = await sessionStore(firestore).findSession(
        sessionId,
      );

      if (!originalSession)
        throw new Error(
          `sessionId ${sessionId}, not found. Unable to update session`,
        );

      const { updatedSession, userResults, eventResults } = await updateSession(
        {
          eventId: originalSession.eventId,
          sessionId,
          user,
          session: regular,
          firestore,
        },
      );

      sendUserEvent({
        originalSession,
        updatedSession,
        userResults,
        userEvents,
        user,
        eventResults,
      });

      return updatedSession;
    },
    panel: async (
      { sessionId },
      { session: panel },
      {
        dataSources: {
          firestore,
          events: { userEvents },
        },
        user,
      },
    ) => {
      dlog('panel called');

      // we need the original before we update it.
      const originalSession = await sessionStore(firestore).findSession(
        sessionId,
      );

      if (!originalSession)
        throw new Error(
          `sessionId ${sessionId}, not found. Unable to update session`,
        );

      const { updatedSession, userResults, eventResults } = await updateSession(
        {
          eventId: originalSession.eventId,
          sessionId,
          user,
          session: panel,
          firestore,
        },
      );

      sendUserEvent({
        originalSession,
        updatedSession,
        userResults,
        userEvents,
        user,
        eventResults,
      });

      return updatedSession;
    },
    workshop: async (
      { sessionId },
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

      // we need the original before we update it.
      const originalSession = await sessionStore(firestore).findSession(
        sessionId,
      );

      if (!originalSession)
        throw new Error(
          `sessionId ${sessionId}, not found. Unable to update session`,
        );

      const { updatedSession, userResults, eventResults } = await updateSession(
        {
          eventId: originalSession.eventId,
          sessionId,
          user,
          session: workshop,
          firestore,
        },
      );

      sendUserEvent({
        originalSession,
        updatedSession,
        userResults,
        userEvents,
        user,
        eventResults,
      });

      return updatedSession;
    },
  },
};
