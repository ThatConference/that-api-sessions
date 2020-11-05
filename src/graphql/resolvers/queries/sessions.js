/* eslint-disable no-unused-vars */
/* eslint-disable import/prefer-default-export */
import debug from 'debug';
import sessionStore from '../../../dataSources/cloudFirestore/session';

const dlog = debug('that:api:sessions:query:SessionsQuery');

export const fieldResolvers = {
  SessionsQuery: {
    me: () => {
      dlog('me called');
      return {};
    },
    session: (_, { sessionId }, { dataSources: { firestore } }) => {
      dlog('session called');
      return sessionStore(firestore).findAcceptedSession(sessionId);
    },
    all: (
      _,
      {
        status = ['APPROVED'],
        filter = 'UPCOMING',
        orderBy,
        asOfDate,
        pageSize,
        cursor,
      },
      { dataSources: { firestore } },
    ) => {
      dlog(
        'paged called: status %o page size %d, after %s, orderedBy %s, having statuses %o with filter %s',
        status,
        pageSize,
        cursor,
        orderBy,
        status,
        filter,
      );
      return sessionStore(firestore).findWithStatusesPaged({
        statuses: status,
        filter,
        asOfDate,
        orderBy,
        pageSize,
        cursor,
      });
    },
  },
};
