import debug from 'debug';
import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:session:query:eventDestination');

export const fieldResolvers = {
  EventDestinationQuery: {
    sessions: ({ eventId, name }, __, { dataSources: { firestore } }) => {
      dlog('Event Destination Sessions params %s, %s', eventId, name);
      return sessionStore(firestore).findByEventRoom({
        eventId,
        distination: name,
      });
    },
  },
};
