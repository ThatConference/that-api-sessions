import debug from 'debug';
import { dataSources } from '@thatconference/api';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import memberStore from '../../../dataSources/cloudFirestore/member';
import constants from '../../../constants';

const eventStore = dataSources.cloudFirestore.event;
const dlog = debug('that:api:sessions:mutation:AdminSessionUpdate');

async function updateSession({
  eventId,
  sessionId,
  session,
  originalSession,
  firestore,
}) {
  const [updatedSession, speakerResults, eventResults] = await Promise.all([
    sessionStore(firestore).adminUpdate({
      sessionId,
      session,
    }),
    memberStore(firestore).find(originalSession.speakers[0]),
    eventStore(firestore).get(eventId),
  ]);

  return { updatedSession, speakerResults, eventResults };
}

export function hasChangesforEventNotification({
  originalSession,
  updatedSession,
}) {
  const originalDate =
    originalSession.startTime instanceof Date
      ? originalSession.startTime.getTime()
      : 'TBD';
  const updatedDate =
    updatedSession.startTime instanceof Date
      ? updatedSession.startTime.getTime()
      : 'TBD';
  const originalRoom = originalSession?.location?.destination || 'TBD';
  const updatedRoom = updatedSession?.location?.destination || 'TBD';

  return (
    originalDate !== updatedDate ||
    originalRoom !== updatedRoom ||
    originalSession.type !== updatedSession.type
  );
}

function sendAdminEvent({
  originalSession,
  updatedSession,
  speakerResults,
  adminEvents,
  user,
  eventResults,
  sendNotification,
  firestore,
}) {
  dlog(
    'sendAdminEvent original status: %s, updated status: %s',
    originalSession.status,
    updatedSession.status,
  );
  let eventTitle = '';

  if (
    originalSession.status === 'DRAFT' &&
    updatedSession.status === 'SUBMITTED'
  ) {
    // eventTitle = 'sessionCreated';
    // no admin events on create
    return;
  }
  if (updatedSession.status === 'ACCEPTED') {
    eventTitle = 'sessionUpdated';
  } else if (updatedSession.status === 'CANCELLED') {
    eventTitle = 'sessionCancelled';
  }
  // determines if there are actual chages in update
  // to send notifications to members;
  const hasChanges = hasChangesforEventNotification({
    originalSession,
    updatedSession,
  });

  adminEvents.emit(eventTitle, {
    user,
    speaker: speakerResults,
    session: updatedSession,
    originalSession,
    event: eventResults,
    sendNotification: sendNotification && hasChanges,
    firestore,
  });
}

function sendGraphCdnEvent({ graphCdnEvents, updatedSession }) {
  if (
    ['ACCEPTED', 'CANCELLED', 'SCHEDULED', 'WITHDREW'].includes(
      updatedSession.status,
    )
  ) {
    graphCdnEvents.emit(
      constants.GRAPHCDN.EVENT_NAME.PURGE,
      constants.GRAPHCDN.PURGE.SESSION,
      updatedSession.id,
    );
  }
}

export const fieldResolvers = {
  AdminSessionUpdate: {
    openSpace: async (
      { sessionId },
      { session: openspace, sendNotification = false },
      {
        dataSources: {
          firestore,
          events: { adminEvents, graphCdnEvents },
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

      const { updatedSession, speakerResults, eventResults } =
        await updateSession({
          eventId: originalSession.eventId,
          sessionId,
          session: openspace,
          originalSession,
          firestore,
        });

      sendAdminEvent({
        originalSession,
        updatedSession,
        speakerResults,
        adminEvents,
        user,
        eventResults,
        sendNotification,
        firestore,
      });
      sendGraphCdnEvent({ graphCdnEvents, updatedSession });

      return updatedSession;
    },
    keynote: async (
      { sessionId, sendNotification = false },
      { session: keynote },
      {
        dataSources: {
          firestore,
          events: { adminEvents, graphCdnEvents },
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

      const { updatedSession, speakerResults, eventResults } =
        await updateSession({
          eventId: originalSession.eventId,
          sessionId,
          session: keynote,
          originalSession,
          firestore,
        });

      sendAdminEvent({
        originalSession,
        updatedSession,
        speakerResults,
        adminEvents,
        user,
        eventResults,
        sendNotification,
        firestore,
      });
      sendGraphCdnEvent({ graphCdnEvents, updatedSession });

      return updatedSession;
    },
    regular: async (
      { sessionId },
      { session: regular, sendNotification = false },
      {
        dataSources: {
          firestore,
          events: { adminEvents, graphCdnEvents },
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

      const { updatedSession, speakerResults, eventResults } =
        await updateSession({
          eventId: originalSession.eventId,
          sessionId,
          session: regular,
          originalSession,
          firestore,
        });

      sendAdminEvent({
        originalSession,
        updatedSession,
        speakerResults,
        adminEvents,
        user,
        eventResults,
        sendNotification,
        firestore,
      });
      sendGraphCdnEvent({ graphCdnEvents, updatedSession });

      return updatedSession;
    },
    panel: async (
      { sessionId },
      { session: panel, sendNotification = false },
      {
        dataSources: {
          firestore,
          events: { adminEvents, graphCdnEvents },
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

      const { updatedSession, speakerResults, eventResults } =
        await updateSession({
          eventId: originalSession.eventId,
          sessionId,
          session: panel,
          originalSession,
          firestore,
        });

      sendAdminEvent({
        originalSession,
        updatedSession,
        speakerResults,
        adminEvents,
        user,
        eventResults,
        sendNotification,
        firestore,
      });
      sendGraphCdnEvent({ graphCdnEvents, updatedSession });

      return updatedSession;
    },
    workshop: async (
      { sessionId },
      { session: workshop, sendNotification = false },
      {
        dataSources: {
          firestore,
          events: { adminEvents, graphCdnEvents },
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

      const { updatedSession, speakerResults, eventResults } =
        await updateSession({
          eventId: originalSession.eventId,
          sessionId,
          session: workshop,
          originalSession,
          firestore,
        });

      sendAdminEvent({
        originalSession,
        updatedSession,
        speakerResults,
        adminEvents,
        user,
        eventResults,
        sendNotification,
        firestore,
      });
      sendGraphCdnEvent({ graphCdnEvents, updatedSession });

      return updatedSession;
    },
  },
};
