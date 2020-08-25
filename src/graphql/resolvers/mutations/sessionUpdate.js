/* eslint-disable import/prefer-default-export */
import debug from 'debug';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import memberStore from '../../../dataSources/cloudFirestore/member';

const dlog = debug('that:api:sessions:mutation:SessionUpdate');

async function updateSession(sessionId, user, session, firestore) {
  const [updatedSession, userResults] = await Promise.all([
    sessionStore(firestore).update({
      user,
      sessionId,
      session,
    }),

    memberStore(firestore).find(user.sub),
  ]);

  return { updatedSession, userResults };
}

function sendUserEvent(
  originalSession,
  updatedSession,
  userResults,
  userEvents,
) {
  if (
    originalSession.status === 'DRAFT' &&
    updatedSession.status === 'SUBMITTED'
  ) {
    userEvents.emit('sessionCreated', {
      user: userResults,
      session: updatedSession,
    });
  } else if (updatedSession.status === 'ACCEPTED') {
    userEvents.emit('sessionUpdated', {
      user: userResults,
      session: updatedSession,
    });
  } else if (updatedSession.status === 'CANCELLED') {
    userEvents.emit('sessionCancelled', {
      user: userResults,
      session: updatedSession,
    });
  }
}

export const fieldResolvers = {
  SessionUpdate: {
    update: async (
      { sessionId },
      { session },
      {
        dataSources: {
          firestore,
          events: { userEvents },
        },
        user,
      },
    ) => {
      dlog('TCL: events %o', userEvents);
      dlog('update called', sessionId);

      // we need the original before we update it.
      const originalSession = await sessionStore(firestore).findMySession({
        user,
        sessionId,
      });

      const [updatedSession, userResults] = await Promise.all([
        sessionStore(firestore).update({
          user,
          sessionId,
          session,
        }),

        memberStore(firestore).find(user.sub),
      ]);

      sendUserEvent(originalSession, updatedSession, userResults, userEvents);

      return updatedSession;
    },
    openSpace: async (
      { sessionId },
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

      // we need the original before we update it.
      const originalSession = await sessionStore(firestore).findMySession({
        user,
        sessionId,
      });

      const { updatedSession, userResults } = await updateSession(
        sessionId,
        user,
        openspace,
        firestore,
      );

      sendUserEvent(originalSession, updatedSession, userResults, userEvents);

      return updatedSession;
    },
    keynote: async (
      { sessionId },
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

      // we need the original before we update it.
      const originalSession = await sessionStore(firestore).findMySession({
        user,
        sessionId,
      });

      const { updatedSession, userResults } = await updateSession(
        sessionId,
        user,
        keynote,
        firestore,
      );

      sendUserEvent(originalSession, updatedSession, userResults, userEvents);

      return updatedSession;
    },
    regular: async (
      { sessionId },
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

      // we need the original before we update it.
      const originalSession = await sessionStore(firestore).findMySession({
        user,
        sessionId,
      });

      const { updatedSession, userResults } = await updateSession(
        sessionId,
        user,
        regular,
        firestore,
      );

      sendUserEvent(originalSession, updatedSession, userResults, userEvents);

      return updatedSession;
    },
    panel: async (
      { sessionId },
      { panel },
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
      const originalSession = await sessionStore(firestore).findMySession({
        user,
        sessionId,
      });

      const { updatedSession, userResults } = await updateSession(
        sessionId,
        user,
        panel,
        firestore,
      );

      sendUserEvent(originalSession, updatedSession, userResults, userEvents);

      return updatedSession;
    },
    workshop: async (
      { sessionId },
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

      // we need the original before we update it.
      const originalSession = await sessionStore(firestore).findMySession({
        user,
        sessionId,
      });

      const { updatedSession, userResults } = await updateSession(
        sessionId,
        user,
        workshop,
        firestore,
      );

      sendUserEvent(originalSession, updatedSession, userResults, userEvents);

      return updatedSession;
    },
  },
};
