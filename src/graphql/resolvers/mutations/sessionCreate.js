/* eslint-disable import/prefer-default-export */
import debug from 'debug';
import { dataSources } from '@thatconference/api';

import sessionStore from '../../../dataSources/cloudFirestore/session';
import memberStore from '../../../dataSources/cloudFirestore/member';
import constants from '../../../constants';

const eventStore = dataSources.cloudFirestore.event;

const dlog = debug('that:api:sessions:mutation:SessionCreate');

async function createNewSession({ eventId, user, session, firestore }) {
  const [sessionResults, userResults, eventResults] = await Promise.all([
    sessionStore(firestore).create({
      eventId,
      user,
      session,
    }),
    memberStore(firestore).find(user.sub),
    eventStore(firestore).get(eventId),
  ]);

  return { sessionResults, userResults, eventResults };
}

function sendUserEvent({
  sessionResults,
  userResults,
  eventResults,
  userEvents,
  user,
  firestore,
}) {
  if (['SUBMITTED', 'ACCEPTED'].includes(sessionResults.status)) {
    userEvents.emit('sessionCreated', {
      user: {
        ...user,
        ...userResults,
      },
      session: sessionResults,
      event: eventResults,
      firestore,
    });
  }
}

function sendGraphCdnEvent({ graphCdnEvents, sessionResults }) {
  if (['ACCEPTED'].includes(sessionResults.status)) {
    graphCdnEvents.emit(constants.GRAPHCDN.EVENT_NAME.CREATED_SESSION, {
      eventId: sessionResults.eventId,
      memberIds: sessionResults.speakers,
    });
  }
}

export const fieldResolvers = {
  SessionCreate: {
    create: async () => {
      throw Error('No Longer Implemented');
    },
    openSpace: async (
      { eventId },
      { session: openspace },
      {
        dataSources: {
          firestore,
          events: { userEvents, graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('openSpace called');

      const session = openspace;
      session.type = 'OPEN_SPACE';

      const { sessionResults, userResults, eventResults } =
        await createNewSession({ eventId, user, session, firestore });

      sendUserEvent({
        sessionResults,
        userResults,
        eventResults,
        userEvents,
        user,
        firestore,
      });
      sendGraphCdnEvent({ graphCdnEvents, sessionResults });

      return sessionResults;
    },
    keynote: async (
      { eventId },
      { session: keynote },
      {
        dataSources: {
          firestore,
          events: { userEvents, graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('keynote called');

      const session = keynote;
      session.type = 'KEYNOTE';

      const { sessionResults, userResults, eventResults } =
        await createNewSession({ eventId, user, session, firestore });

      sendUserEvent({
        sessionResults,
        userResults,
        eventResults,
        userEvents,
        user,
        firestore,
      });
      sendGraphCdnEvent({ graphCdnEvents, sessionResults });

      return sessionResults;
    },
    regular: async (
      { eventId },
      { session: regular },
      {
        dataSources: {
          firestore,
          events: { userEvents, graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('regular called');

      const session = regular;
      session.type = 'REGULAR';

      const { sessionResults, userResults, eventResults } =
        await createNewSession({ eventId, user, session, firestore });

      sendUserEvent({
        sessionResults,
        userResults,
        eventResults,
        userEvents,
        user,
        firestore,
      });
      sendGraphCdnEvent({ graphCdnEvents, sessionResults });

      return sessionResults;
    },
    panel: async (
      { eventId },
      { session: panel },
      {
        dataSources: {
          firestore,
          events: { userEvents, graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('openSpace called');

      const session = panel;
      session.type = 'PANEL';

      const { sessionResults, userResults, eventResults } =
        await createNewSession({ eventId, user, session, firestore });

      sendUserEvent({
        sessionResults,
        userResults,
        eventResults,
        userEvents,
        user,
        firestore,
      });
      sendGraphCdnEvent({ graphCdnEvents, sessionResults });

      return sessionResults;
    },
    workshop: async (
      { eventId },
      { session: workshop },
      {
        dataSources: {
          firestore,
          events: { userEvents, graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('workshop called');

      const session = workshop;
      session.type = 'WORKSHOP';

      const { sessionResults, userResults, eventResults } =
        await createNewSession({ eventId, user, session, firestore });

      sendUserEvent({
        sessionResults,
        userResults,
        eventResults,
        userEvents,
        user,
        firestore,
      });
      sendGraphCdnEvent({ graphCdnEvents, sessionResults });

      return sessionResults;
    },
  },
};
