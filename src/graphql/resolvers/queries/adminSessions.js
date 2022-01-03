import debug from 'debug';
import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:querty:AdminSessions');

export const fieldResolvers = {
  AdminSessionsQuery: {
    pullSchedule: () => {
      throw new Error('Not Implemented yet');
    },
    all: (
      _,
      { eventId, status = ['APPROVED'], orderBy },
      { dataSources: { firestore } },
    ) => {
      dlog('all called with statuses %o, orderBy %s', status, orderBy);
      return sessionStore(firestore).findWithStatuses({
        statuses: status,
        orderBy,
        eventId,
      });
    },
  },
};
