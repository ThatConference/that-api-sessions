/* eslint-disable import/prefer-default-export */
import debug from 'debug';
import { ForbiddenError } from 'apollo-server-express';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import memberStore from '../../../dataSources/cloudFirestore/member';
import eventStore from '../../../dataSources/cloudFirestore/event';
import checkMemberCanMutate from '../../../lib/checkMemberCanMutate';

const dlog = debug('that:api:sessions:mutation:SessionUpdate');
const clearProtectedFieldStatus = [
  'SUBMITTED',
  'DRAFT',
  'CANCELLED',
  'WITHDREW',
];

async function updateSession({ eventId, sessionId, user, session, firestore }) {
  const [updatedSession, userResults, eventResults] = await Promise.all([
    sessionStore(firestore).update({
      user,
      sessionId,
      session,
    }),
    memberStore(firestore).find(user.sub),
    eventStore(firestore).getEvent(eventId),
  ]);

  return { updatedSession, userResults, eventResults };
}

// Clear protected fields; used when switching session type
// from OpenSpace to others.
function clearProtectedFields(clsSession) {
  dlog('Clearing Protected Fields.');
  const cs = clsSession;
  cs.startTime = null;
  cs.location = '';
}

async function validateEventIdUpdate({
  newEventId,
  originalEventId,
  user,
  firestore,
}) {
  if (newEventId && newEventId !== originalEventId) {
    // if changing eventId, ensure they have access to new EventId
    const canMutate = await checkMemberCanMutate({
      user,
      eventId: newEventId,
      firestore,
    });
    if (!canMutate)
      throw new ForbiddenError(
        'User unable to mutate target eventId. Update failed',
      );
  }
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
    eventTitle = 'sessionCreated';
  } else if (
    updatedSession.status === 'ACCEPTED' ||
    (originalSession.status === 'SUBMITTED' &&
      updatedSession.status === 'SUBMITTED')
  ) {
    eventTitle = 'sessionUpdated';
  } else if (updatedSession.status === 'CANCELLED') {
    eventTitle = 'sessionCancelled';
  }

  userEvents.emit(eventTitle, {
    user: userInfo,
    session: updatedSession,
    event: eventResults,
  });
}

export const fieldResolvers = {
  SessionUpdate: {
    update: async () => {
      throw Error('No Longer Implemented');
    },
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
      const originalSession = await sessionStore(firestore).findMySession({
        user,
        sessionId,
      });

      if (!originalSession)
        throw new Error('SessionId not found for for current user.');

      await validateEventIdUpdate({
        newEventId: openspace.eventId,
        originalEventId: originalSession.eventId,
        user,
        firestore,
      });

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
      const originalSession = await sessionStore(firestore).findMySession({
        user,
        sessionId,
      });

      if (!originalSession)
        throw new Error('SessionId not found for for current user.');

      await validateEventIdUpdate({
        newEventId: keynote.eventId,
        originalEventId: originalSession.eventId,
        user,
        firestore,
      });

      if (clearProtectedFieldStatus.includes(keynote.status))
        clearProtectedFields(keynote);

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
      const originalSession = await sessionStore(firestore).findMySession({
        user,
        sessionId,
      });

      if (!originalSession)
        throw new Error('SessionId not found for for current user.');

      await validateEventIdUpdate({
        newEventId: regular.eventId,
        originalEventId: originalSession.eventId,
        user,
        firestore,
      });

      if (clearProtectedFieldStatus.includes(regular.status))
        clearProtectedFields(regular);

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
      const originalSession = await sessionStore(firestore).findMySession({
        user,
        sessionId,
      });

      if (!originalSession)
        throw new Error('SessionId not found for for current user.');

      await validateEventIdUpdate({
        newEventId: panel.eventId,
        originalEventId: originalSession.eventId,
        user,
        firestore,
      });

      if (clearProtectedFieldStatus.includes(panel.status))
        clearProtectedFields(panel);

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
      const originalSession = await sessionStore(firestore).findMySession({
        user,
        sessionId,
      });

      if (!originalSession)
        throw new Error('SessionId not found for for current user.');

      await validateEventIdUpdate({
        newEventId: workshop.eventId,
        originalEventId: originalSession.eventId,
        user,
        firestore,
      });

      if (clearProtectedFieldStatus.includes(workshop.status))
        clearProtectedFields(workshop);

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
