/* eslint-disable import/prefer-default-export */
import debug from 'debug';
import { ForbiddenError } from 'apollo-server-express';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import memberStore from '../../../dataSources/cloudFirestore/member';
import checkMemberCanMutate from '../../../lib/checkMemberCanMutate';

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

function sendUserEvent({
  originalSession,
  updatedSession,
  userResults,
  userEvents,
  user,
}) {
  const userInfo = {
    ...user,
    ...userResults,
  };
  if (
    originalSession.status === 'DRAFT' &&
    updatedSession.status === 'SUBMITTED'
  ) {
    userEvents.emit('sessionCreated', {
      user: userInfo,
      session: updatedSession,
    });
  } else if (updatedSession.status === 'ACCEPTED') {
    userEvents.emit('sessionUpdated', {
      user: userInfo,
      session: updatedSession,
    });
  } else if (updatedSession.status === 'CANCELLED') {
    userEvents.emit('sessionCancelled', {
      user: userInfo,
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

      if (!originalSession)
        throw new Error('SessionId not found for for current user.');

      const [updatedSession, userResults] = await Promise.all([
        sessionStore(firestore).update({
          user,
          sessionId,
          session,
        }),

        memberStore(firestore).find(user.sub),
      ]);

      sendUserEvent({
        originalSession,
        updatedSession,
        userResults,
        userEvents,
        user,
      });

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

      if (!originalSession)
        throw new Error('SessionId not found for for current user.');

      if (openspace.eventId && openspace.eventId !== originalSession.eventId) {
        // if changing eventId, ensure they have access to new EventId
        const canMutate = await checkMemberCanMutate({
          user,
          eventId: openspace.eventId,
          firestore,
        });
        if (!canMutate)
          throw new ForbiddenError(
            'User unable to mutate target eventId. Update failed',
          );
      }

      const { updatedSession, userResults } = await updateSession(
        sessionId,
        user,
        openspace,
        firestore,
      );

      sendUserEvent({
        originalSession,
        updatedSession,
        userResults,
        userEvents,
        user,
      });

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

      if (!originalSession)
        throw new Error('SessionId not found for for current user.');

      const { updatedSession, userResults } = await updateSession(
        sessionId,
        user,
        keynote,
        firestore,
      );

      sendUserEvent({
        originalSession,
        updatedSession,
        userResults,
        userEvents,
        user,
      });

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

      if (!originalSession)
        throw new Error('SessionId not found for for current user.');

      const { updatedSession, userResults } = await updateSession(
        sessionId,
        user,
        regular,
        firestore,
      );

      sendUserEvent({
        originalSession,
        updatedSession,
        userResults,
        userEvents,
        user,
      });

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

      if (!originalSession)
        throw new Error('SessionId not found for for current user.');

      const { updatedSession, userResults } = await updateSession(
        sessionId,
        user,
        panel,
        firestore,
      );

      sendUserEvent({
        originalSession,
        updatedSession,
        userResults,
        userEvents,
        user,
      });

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

      if (!originalSession)
        throw new Error('SessionId not found for for current user.');

      const { updatedSession, userResults } = await updateSession(
        sessionId,
        user,
        workshop,
        firestore,
      );

      sendUserEvent({
        originalSession,
        updatedSession,
        userResults,
        userEvents,
        user,
      });

      return updatedSession;
    },
  },
};
